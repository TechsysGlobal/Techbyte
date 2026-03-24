import NodeCache from 'node-cache';

// StdTTL: 300 seconds (5 minutes)
// Checkperiod: 600 seconds (10 minutes)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

export default cache;
