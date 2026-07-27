// ===== Hornero APP — Data Loader =====
// Carga JSON data files y cachea en IndexedDB para offline
// Strategy: fetch from server → cache in IndexedDB → fallback to IndexedDB when offline

var dataLoaded = {};
var dataVersion = null;

// ===== Load JSON file with offline fallback =====
function loadData(file) {
  var url = 'data/' + file;
  // Try fetch from server first
  return fetch(url)
    .then(function(r) {
      if (!r.ok) throw new Error('Fetch failed: ' + r.status);
      return r.json();
    })
    .then(function(data) {
      dataLoaded[file] = data;
      // Cache in IndexedDB for offline access
      if (db) {
        dbPut('uiState', { key: 'data-' + file, value: JSON.stringify(data) });
      }
      // Track data version
      if (data.meta && data.meta.version) {
        dataVersion = data.meta.version;
        if (db) {
          dbPut('uiState', { key: 'dataVersion', value: dataVersion });
        }
      }
      return data;
    })
    .catch(function(err) {
      // Offline fallback: read from IndexedDB
      console.warn('Fetch failed for ' + file + ', trying IndexedDB:', err.message);
      if (db) {
        return dbGet('uiState', 'data-' + file).then(function(record) {
          if (record && record.value) {
            var data = JSON.parse(record.value);
            dataLoaded[file] = data;
            return data;
          }
          throw new Error('No cached data for ' + file);
        });
      }
      throw new Error('IndexedDB not initialized');
    });
}

// ===== Load all initial data =====
function loadAllData() {
  var files = [
    'is-piloto-aceitero.json'
    // More data files will be added as they're created:
    // 'clipping-2.json',
    // 'clipping-3.json',
    // 'smvm.json',
    // 'sectors.json'
  ];

  var promises = files.map(function(f) {
    return loadData(f).catch(function(err) {
      console.warn('Data load error for ' + f + ':', err.message);
      return null;
    });
  });

  return Promise.all(promises).then(function(results) {
    // Store loaded data by file name
    results.forEach(function(r, i) {
      if (r) dataLoaded[files[i]] = r;
    });
    return dataLoaded;
  });
}

// ===== Clean old seeded simulation data =====
// Removes fuentesPrimarias, informes, and correcciones that were seeded
// from old simulation versions (before 2026-07-27)
function cleanOldSimulationData() {
  if (!db) return Promise.resolve();

  return dbGet('uiState', 'seeded-version-2026-07-22').then(function(oldSeed) {
    if (!oldSeed) return Promise.resolve(); // No old seed — nothing to clean

    console.log('Cleaning old simulation data (version 2026-07-22)...');

    var cleanupPromises = [];

    // Remove all seeded fuentesPrimarias
    cleanupPromises.push(dbGetAll('fuentesPrimarias').then(function(all) {
      if (!all) return Promise.resolve();
      return Promise.all(all.filter(function(fp) {
        // Only remove seeded items (fp-A, fp-B, fp-C, fp-D from simulation)
        return fp.id && fp.id.startsWith('fp-');
      }).map(function(fp) { return dbDelete('fuentesPrimarias', fp.id); }));
    }));

    // Remove seeded informes only (g1-A, g1-B from initial simulation data)
    // NOT all g1-* — user-created informes also use g1- prefix
    cleanupPromises.push(dbGetAll('informes').then(function(all) {
      if (!all) return Promise.resolve();
      return Promise.all(all.filter(function(inf) {
        // Only remove the specific seeded IDs from simulation data
        return inf.id && (inf.id === 'g1-A' || inf.id === 'g1-B' || inf.estado === 'pendiente_revision');
      }).map(function(inf) { return dbDelete('informes', inf.id); }));
    }));

    // Remove all seeded correcciones
    cleanupPromises.push(dbGetAll('correcciones').then(function(all) {
      if (!all) return Promise.resolve();
      return Promise.all(all.filter(function(cor) {
        return cor.id && cor.id.startsWith('corr-');
      }).map(function(cor) { return dbDelete('correcciones', cor.id); }));
    }));

    // Remove the old seed version marker
    cleanupPromises.push(dbDelete('uiState', 'seeded-version-2026-07-22'));

    return Promise.all(cleanupPromises).then(function() {
      console.log('Old simulation data cleaned');
    });
  }).catch(function(e) {
    console.warn('Simulation data cleanup failed:', e);
  });
}

// ===== Seed IndexedDB with JSON data (for initial setup) =====
function seedData(jsonData) {
  if (!jsonData || !db) return Promise.resolve();

  // Version check: skip seeding if data already exists with same version
  var dataVersion = jsonData.meta && jsonData.meta.version;
  if (dataVersion) {
    return dbGet('uiState', 'seeded-version-' + dataVersion).then(function(existing) {
      if (existing) {
        console.log('Data already seeded (version ' + dataVersion + '), skipping');
        return Promise.resolve();
      }
      return doSeed(jsonData, dataVersion);
    }).catch(function() {
      // If uiState lookup fails, proceed with seeding anyway
      return doSeed(jsonData, dataVersion);
    });
  }
  // No version in data — seed regardless
  return doSeed(jsonData, null);
}

function doSeed(jsonData, dataVersion) {
  var promises = [];

  // Seed fuentes primarias
  if (jsonData.fuentesPrimarias) {
    jsonData.fuentesPrimarias.forEach(function(fp) {
      promises.push(guardarFuentePrimaria(fp));
    });
  }

  // Seed informes G1
  if (jsonData.informesG1) {
    jsonData.informesG1.forEach(function(inf) {
      promises.push(guardarInforme(inf));
    });
  }

  // Seed correcciones
  if (jsonData.correcciones) {
    jsonData.correcciones.forEach(function(cor) {
      promises.push(guardarCorreccion(cor));
    });
  }

  // Seed sector data (NEW: previously lost after JSON loading)
  if (jsonData.sector) {
    var sectorRecord = Object.assign({ id: jsonData.sector.federacion || 'default-sector' }, jsonData.sector);
    promises.push(guardarSector(sectorRecord));
  }

  return Promise.all(promises).then(function() {
    // Mark seeding as complete for this version
    if (dataVersion) {
      dbPut('uiState', { key: 'seeded-version-' + dataVersion, value: 'done' });
    }
    console.log('Data seeded: ' + promises.length + ' records (version ' + (dataVersion || 'unknown') + ')');
  });
}

// ===== Check for data updates =====
function checkDataUpdates() {
  // Compare local dataVersion with server version.json
  return fetch('data/version.json')
    .then(function(r) { return r.json(); })
    .then(function(serverVersion) {
      var localVersion = null;
      if (db) {
        return dbGet('uiState', 'dataVersion').then(function(record) {
          localVersion = record ? record.value : null;
          return { serverVersion: serverVersion, localVersion: localVersion, needsUpdate: serverVersion.dataVersion !== localVersion };
        });
      }
      return { serverVersion: serverVersion, localVersion: null, needsUpdate: true };
    })
    .catch(function() {
      // Offline or no version.json — assume no update needed
      return { needsUpdate: false };
    });
}
