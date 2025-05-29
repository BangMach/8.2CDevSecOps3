pipeline {
    agent any

    parameters {
        string(name: 'BRANCH_NAME', defaultValue: 'main2', description: 'Branch to build')
        string(name: 'AWS_REGION', defaultValue: 'ap-southeast-2', description: 'AWS Region')
    }

    environment {
        NODE_ENV = 'test'
        SONAR_SCANNER_HOME = "${WORKSPACE}/sonar-scanner"
        DOCKER_IMAGE = "my-node-app:${env.BUILD_NUMBER}"
        MONGODB_URI = "mongodb://mongodb:27017/express-todo-test"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: "${params.BRANCH_NAME}", url: 'https://github.com/BangMach/8.2CDevSecOps3.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
                
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

                                # Validate SonarScanner configuration
                                if grep -q 'sonar.issue.ignore.allfile=.*,' sonar-project.properties; then
                                    echo "Warning: Blank entries detected in sonar.issue.ignore.allfile. Please fix the configuration."
                                    exit 1
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
        // stage('Build Docker Image') {
        //     when {
        //         expression {
        //             // Check if Docker-related files have changed
        //             def changes = sh(script: "git diff --name-only HEAD~1 | grep -E 'Dockerfile|package.json|src/' || true", returnStdout: true).trim()
        //             return changes != ""
        //         }
        //     }
        //     steps {
        //         script {
        //             echo "Building Docker image: ${DOCKER_IMAGE}"

        //             // Build the image
        //             sh "docker build -t ${DOCKER_IMAGE} ."

        //             // Save as artifact (tarball)
        //             sh "docker save ${DOCKER_IMAGE} -o my-node-app-${env.BUILD_NUMBER}.tar"

        //             // Archive the Docker image
        //             archiveArtifacts artifacts: "my-node-app-${env.BUILD_NUMBER}.tar", fingerprint: true
        //         }
        //     }
        // }
        stage('Deploy to Staging (Elastic Beanstalk)') {
        steps {
            withCredentials([usernamePassword(credentialsId: 'aws-creds', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
            sh '''
                export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                export AWS_DEFAULT_REGION=ap-southeast-2

                # Zip Docker EB config
                zip -r deploy.zip Dockerrun.aws.json

                # Upload to S3
                aws s3 cp deploy.zip s3://my-app-deployments-hd/deploy-${BUILD_NUMBER}.zip

                # Register application version
                aws elasticbeanstalk create-application-version \
                --application-name my-app \
                --version-label v${BUILD_NUMBER} \
                --source-bundle S3Bucket=my-app-deployments-hd,S3Key=deploy-${BUILD_NUMBER}.zip

                # Update environment
                aws elasticbeanstalk update-environment \
                --environment-name my-app-staging \
                --version-label v${BUILD_NUMBER}
            '''
            }
        }
        }

        stage('Release to Production') {
            steps {
                script {
                // config git user identity
                sh '''
                    git config --global user.name "Bang Dieu Mach"
                    git config --global user.email "machdieubang2110@gmail.com"
                '''
                // Tag the build in Git
                sh "git tag -a v1.0.${BUILD_NUMBER} -m 'Release ${BUILD_NUMBER}'"
                sh "git push origin v1.0.${BUILD_NUMBER}"

                // Create GitHub Release via GH CLI
                sh '''
                    gh release create v1.0.${BUILD_NUMBER} \
                    --title "Release ${BUILD_NUMBER}" \
                    --notes "Automated release from Jenkins" \
                    --repo BangMach/8.2CDevSecOps3
                '''
                }
            }
        }

        stage('Monitor') {
            steps {
                script {
                    echo "Monitoring the application using AWS CloudWatch..."

                    // Query CloudWatch metrics (e.g., CPU utilization)
                    def cpuUtilization = sh(script: '''
                        aws cloudwatch get-metric-statistics \
                            --namespace AWS/EC2 \
                            --metric-name CPUUtilization \
                            --dimensions Name=InstanceId,Value=i-086032fbe1cd9bece \
                            --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
                            --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
                            --period 300 \
                            --statistics Average \
                            --region ap-southeast-2 \
                            --query "Datapoints[0].Average" \
                            --output text
                    ''', returnStdout: true).trim()

                    echo "CPU Utilization: ${cpuUtilization}%"

                    // Validate CPU utilization value
                    if (cpuUtilization == "None" || !cpuUtilization.isNumber()) {
                        echo "Warning: CPU utilization value is invalid or unavailable."
                    } else {
                        // Fail the pipeline if CPU utilization exceeds a threshold
                        if (cpuUtilization.toFloat() > 80) {
                            error "High CPU utilization detected: ${cpuUtilization}%"
                        }
                    }

                    // Query CloudWatch alarms
                    def alarmState = sh(script: '''
                        aws cloudwatch describe-alarms \
                            --region ap-southeast-2 \
                            --query "MetricAlarms[?StateValue=='ALARM'].AlarmName" \
                            --output text
                    ''', returnStdout: true).trim()

                    if (alarmState) {
                        error "CloudWatch alarms triggered: ${alarmState}"
                    }

                    echo "No alarms triggered. Application is healthy."
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