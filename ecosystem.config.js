module.exports = {
  apps: [
    {
      name: "maker-btc",
      script: "bot/MakerOne.js",
      args: "btc.json",
      interpreter: "node",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "maker-sol",
      script: "bot/MakerOne.js",
      args: "sol.json",
      interpreter: "node",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "maker-eth",
      script: "bot/MakerOne.js",
      args: "eth.json",
      interpreter: "node",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
