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
    },
    {
      name: "maker-xrp",
      script: "bot/MakerOne.js",
      args: "xrp.json",
      interpreter: "node",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "maker-suishort",
      script: "bot/MakerOne.js",
      args: "sui.json",
      interpreter: "node",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "maker-mntshort",
      script: "bot/MakerOne.js",
      args: "mnt.json",
      interpreter: "node",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "maker-bnbshort",
      script: "bot/MakerOne.js",
      args: "bnb.json",
      interpreter: "node",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },    
    {
      name: "ngiworks-web",
      script: "bot/ngiworks-simple.js",
      interpreter: "node",
      autorestart: true,
      watch: false,
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "80"
      },
      error_file: "./logs/ngiworks-error.log",
      out_file: "./logs/ngiworks-out.log",
      log_file: "./logs/ngiworks-combined.log",
      time: true,
      max_memory_restart: "200M"
    }  
  ]
};
