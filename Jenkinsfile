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
        // stage('Static Code Analysis') {
        //     parallel {
        //         stage('ESLint') {
        //             steps {
        //                 sh 'npx eslint . || true'
        //             }
        //         }
        //         stage('SonarCloud Analysis') {
        //             steps {
        //                 withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
        //                     sh '''
        //                         if [ ! -d "$SONAR_SCANNER_HOME" ]; then
        //                             curl -sSLo sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
        //                             unzip sonar-scanner.zip -d .
        //                             mv sonar-scanner-* sonar-scanner
        //                         fi
        //                         ${SONAR_SCANNER_HOME}/bin/sonar-scanner -Dsonar.login=$SONAR_TOKEN
        //                     '''
        //                 }
        //             }
        //         }
        //     }
        // }
        stage('Run Tests') {
            steps {
                script {
                    try {
                        // Start MongoDB container hello world s
                        sh '''
                            # Clean up old MongoDB container if it exists
                            docker rm -f mongodb || true

                            # Delete all old test-network duplicates
                            docker network prune -f || true

                            # Create a fresh network
                            docker network create test-network || true

                            # Start fresh MongoDB
                            docker run -d --name mongodb --network test-network -p 27017:27017 mongo:latest
                        '''
                    } catch (err) {
                        // Mark build as unstable but don't failsss
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

                    // Debugging: List coverage directory
                    sh 'ls -R coverage || true'

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
        stage('Release') {
            steps {
                script {
                    sh "git tag v1.0.${BUILD_NUMBER}"
                    sh "git push origin v1.0.${BUILD_NUMBER}"
                }
        }
        stage('Monitoring') {
            steps {
                script {
                    def status = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health', returnStdout: true).trim()
                    if (status != "200") {
                        error "Health check failed"
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    docker run -d --rm --name my-node-test -p 3000:3000 my-node-app:${BUILD_NUMBER}
                '''
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