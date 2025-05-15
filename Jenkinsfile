pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
        SONAR_SCANNER_HOME = "${WORKSPACE}/sonar-scanner"
        DOCKER_IMAGE = "my-node-app:${env.BUILD_NUMBER}"
        MONGODB_URI = "mongodb://mongodb:27017/express-todo-test"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/BangMach/8.2CDevSecOps3.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
                sh 'npm install --save-dev jest supertest @types/jest jest-junit eslint'
            }
        }
        stage('Static Code Analysis') {
            parallel {
                stage('ESLint') {
                    steps {
                        sh 'npx eslint . || true'
                    }
                }
                stage('SonarCloud Analysis') {
                    steps {
                        withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                            sh '''
                                if [ ! -d "$SONAR_SCANNER_HOME" ]; then
                                    curl -sSLo sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
                                    unzip sonar-scanner.zip -d .
                                    mv sonar-scanner-* sonar-scanner
                                fi
                                ${SONAR_SCANNER_HOME}/bin/sonar-scanner -Dsonar.login=$SONAR_TOKEN
                            '''
                        }
                    }
                }
            }
        }
        stage('Run Tests') {
            steps {
                script {
                    try {
                        // Start MongoDB container hello
                        sh '''
                            docker network create test-network || true
                            docker run -d --name mongodb --network test-network -p 27017:27017 mongo:latest
                            
                            # Wait for MongoDB to be ready
                            sleep 10
                            
                            # Run tests with proper environment
                            MONGODB_URI=${MONGODB_URI} npm run test:ci
                        '''
                    } catch (err) {
                        // Mark build as unstable but don't fail
                        unstable('Tests failed')
                    } finally {
                        // Cleanup
                        sh '''
                            docker stop mongodb || true
                            docker rm mongodb || true
                            docker network rm test-network || true
                        '''
                    }
                }
            }
            post {
                always {
                    // Publish Jest test results
                    junit 'coverage/junit.xml'

                    // Publish coverage report
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
        stage('Security Scan') {
            parallel {
                stage('NPM Audit') {
                    steps {
                        sh 'npm audit || true'
                    }
                }
                stage('Snyk Test') {
                    steps {
                        sh 'npm run security-scan || true'
                    }
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${DOCKER_IMAGE}"

                    // Build the image
                    sh "docker build -t ${DOCKER_IMAGE} ."

                    // Save as artifact (tarball)
                    sh "docker save ${DOCKER_IMAGE} -o my-node-app-${env.BUILD_NUMBER}.tar"

                    // Archive the Docker image
                    archiveArtifacts artifacts: "my-node-app-${env.BUILD_NUMBER}.tar", fingerprint: true
                }
            }
        }
    }
    post {
        always {
            // Clean up workspace
            cleanWs()
        }
    }
}