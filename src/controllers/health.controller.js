const healthCheck = ( req , res ) => {
res.json({
success: true,
message: 'OK',
timestamp: new Date().toISOString(),
});

};

module.exports = { healthCheck };