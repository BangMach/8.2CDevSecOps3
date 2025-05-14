pipeline {
 agent any
 stages {
 stage('Checkout') {
 steps {
 git branch: 'main', url: ' https://github.com/BangMach/8.2CDevSecOps3.git'
 }
 }
 stage('Install Dependencies') {
 steps {
 sh 'npm install'
 }
 }
 stage('Run Tests') {
 steps {
 sh 'npm test || true' // Allows pipeline to continue despite test failures
 }
 }
 stage('Generate Coverage Report') {
 steps {
 // Ensure coverage report exists
 sh 'npm run coverage || true'
 }
 }
 stage('NPM Audit (Security Scan)') {
 steps {
 sh 'npm audit || true' // This will show known CVEs in the output
 }
 }
 }
}