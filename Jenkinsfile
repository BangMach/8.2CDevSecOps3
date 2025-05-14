pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://github.com/BangMach/8.2CDevSecOps3.git'
      }
    }
    stage('Install Dependencies') {
      steps {
        sh '''
          export NVM_DIR="$HOME/.nvm"
          [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
          nvm use 18.15.0
          npm install
        '''
      }
    }
    stage('Run Tests') {
      steps {
        sh '''
          export NVM_DIR="$HOME/.nvm"
          [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
          nvm use 18.15.0
          npm test || true
        '''
      }
    }
    stage('Generate Coverage Report') {
      steps {
        sh '''
          export NVM_DIR="$HOME/.nvm"
          [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
          nvm use 18.15.0
          npm run coverage || true
        '''
      }
    }
    stage('NPM Audit (Security Scan)') {
      steps {
        sh '''
          export NVM_DIR="$HOME/.nvm"
          [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
          nvm use 18.15.0
          npm audit || true
        '''
      }
    }
  }
}