const workerCode = `
    let dbName = 'DocBuilderVault';
    let storeName = 'versions';
    let maxVersions = 30;
    let maxAgeMs = 14 * 24 * 60 * 60 * 1000; // 14 days
    let db = null;

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async function handleSaveActive(docId, data) {
        if (!db) await initDB();
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({
                id: \`active_\${docId}\`,
                docId: docId,
                timestamp: Date.now(),
                content: dataString,
                isMilestone: false
            });

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function handleLoadActive(docId) {
        if (!db) await initDB();
        if (!docId) return null;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(\`active_\${docId}\`);

            request.onsuccess = (event) => {
                if (event.target.result) {
                    resolve(event.target.result.content);
                } else {
                    resolve(null);
                }
            };
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function handleArchiveVersion(content, isMilestone) {
        if (!db) await initDB();

        const timestamp = Date.now();
        const id = 'v_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
        const contentString = typeof content === 'string' ? content : JSON.stringify(content);

        const version = {
            id,
            timestamp,
            content: contentString,
            isMilestone
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(version);

            request.onsuccess = () => resolve(id);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function handleGetHistory() {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index('timestamp');
            
            const request = index.getAll();
            
            request.onsuccess = (event) => {
                const records = event.target.result;
                const history = records.map(r => ({
                    id: r.id,
                    timestamp: r.timestamp,
                    isMilestone: r.isMilestone
                })).sort((a, b) => b.timestamp - a.timestamp);
                
                resolve(history);
            };
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function handleGetVersion(id) {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = (event) => {
                if (event.target.result) {
                    let content = event.target.result.content;
                    try { content = JSON.parse(content); } catch (e) {}
                    resolve(content);
                } else {
                    resolve(null);
                }
            };
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function handleWipe() {
        if (!db) return;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function handleRunGC() {
        if (!db) return;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const index = store.index('timestamp');
            const request = index.getAll();

            request.onsuccess = (event) => {
                let records = event.target.result.filter(r => !String(r.id).startsWith('active_'));
                records.sort((a, b) => a.timestamp - b.timestamp);

                const now = Date.now();
                const idsToDelete = [];

                // 1. Enforce 14-day rule (unless milestone)
                records = records.filter(r => {
                    const age = now - r.timestamp;
                    if (age > maxAgeMs && !r.isMilestone) {
                        idsToDelete.push(r.id);
                        return false; 
                    }
                    return true;
                });

                // 2. Enforce Rule of 30
                const nonMilestones = records.filter(r => !r.isMilestone);
                const overage = records.length - maxVersions;
                
                if (overage > 0) {
                    for (let i = 0; i < overage && i < nonMilestones.length; i++) {
                        idsToDelete.push(nonMilestones[i].id);
                    }
                }

                if (idsToDelete.length > 0) {
                    const delTransaction = db.transaction([storeName], 'readwrite');
                    const delStore = delTransaction.objectStore(storeName);
                    
                    idsToDelete.forEach(id => delStore.delete(id));

                    delTransaction.oncomplete = () => resolve();
                    delTransaction.onerror = (e) => reject(e.target.error);
                } else {
                    resolve();
                }
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    self.onmessage = async (e) => {
        const { id, type, payload } = e.data;
        
        try {
            let result;
            switch (type) {
                case 'init':
                    await initDB();
                    break;
                case 'saveActive':
                    await handleSaveActive(payload.docId, payload.data);
                    break;
                case 'loadActive':
                    result = await handleLoadActive(payload.docId);
                    break;
                case 'archiveVersion':
                    result = await handleArchiveVersion(payload.content, payload.isMilestone);
                    break;
                case 'getHistory':
                    result = await handleGetHistory();
                    break;
                case 'getVersion':
                    result = await handleGetVersion(payload.id);
                    break;
                case 'wipe':
                    await handleWipe();
                    break;
                case 'runGC':
                    await handleRunGC();
                    break;
                default:
                    throw new Error(\`Unknown message type: \${type}\`);
            }
            
            self.postMessage({ id, success: true, result });
        } catch (error) {
            self.postMessage({ id, success: false, error: error.message });
        }
    };
`;

class StorageManager {
    constructor() {
        this.dbName = 'DocBuilderVault';
        this.storeName = 'versions';
        this.draftKey = 'congen_save_v5_5_0'; // Base key for 5.5.x series
        this.saveCount = 0;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        
        this.msgId = 0;
        this.pendingRequests = new Map();

        this.worker.onmessage = (e) => {
            const { id, success, result, error } = e.data;
            if (this.pendingRequests.has(id)) {
                const { resolve, reject } = this.pendingRequests.get(id);
                if (success) {
                    resolve(result);
                } else {
                    reject(new Error(error));
                }
                this.pendingRequests.delete(id);
            }
        };
    }

    _postMessage(type, payload = {}) {
        return new Promise((resolve, reject) => {
            const id = ++this.msgId;
            this.pendingRequests.set(id, { resolve, reject });
            this.worker.postMessage({ id, type, payload });
        });
    }

    init() {
        return this._postMessage('init');
    }

    saveActive(docId, data) {
        const p = this._postMessage('saveActive', { docId, data });
        p.then(() => {
            this.saveCount++;
            if (this.saveCount % 5 === 0) {
                this.runGC().catch(console.error);
            }
        });
        return p;
    }

    loadActive(docId) {
        return this._postMessage('loadActive', { docId });
    }

    archiveVersion(content, isMilestone = false) {
        return this._postMessage('archiveVersion', { content, isMilestone });
    }

    getHistory() {
        return this._postMessage('getHistory');
    }

    getVersion(id) {
        return this._postMessage('getVersion', { id });
    }

    wipe() {
        return this._postMessage('wipe');
    }

    runGC() {
        return this._postMessage('runGC');
    }
}
