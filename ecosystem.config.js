module.exports = {
  apps: [
    {
      name: 'CT-SUIUSDT-LONG', // Name des zweiten Prozesses
      script: './bot/MakerOne.js',
      args: 'sui.json',
      watch: false,
    },
    {
      name: 'CT-SUIUSDT-SHORT', // Name des zweiten Prozesses
      script: './bot/MakerOne.js',
      args: 'suishort.json',
      watch: false,
    },
    {
      name: 'CT-EasyServer', // Name des zweiten Prozesses
      script: './bot/EasyServer.js',
      watch: false,
    },
    {
      name: 'CT-PosWatch', // Name des zweiten Prozesses
      script: './bot/PosWatch.js',
      args: 'sui.json',
      watch: false,
    },


  ],
};

