pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        APP_NAME = "wedding-shahnazia-checkin"
        IMAGE_NAME = "luqmanarfian/wedding-shahnazia-checkin"
        IMAGE_TAG = "${env.GIT_COMMIT}"
        BRANCH = "main"
        SONARQUBE_SERVER = "sonarqube-server"
        NAMESPACE = "default"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

    stage('Build Docker Image') {
        steps {
            script {
                withCredentials([
                    file(
                        credentialsId: 'wedding-shahnazia-env',
                        variable: 'ENV_FILE'
                    )
                ]) {
                    sh '''
                        set -e
    
                        cp "$ENV_FILE" .env.production
    
                        echo "Checking Vite environment..."
    
                        grep -E '^VITE_[A-Za-z0-9_]+=' .env.production || true
    
                        docker build \
                            -t "${IMAGE_NAME}:${IMAGE_TAG}" \
                            .
    
                        rm -f .env.production
                    '''
                }
            }
        }
    }
        stage('Security Scan') {
            steps {
                // Menjalankan perintah lewat 'docker run' langsung terbukti jauh lebih stabil daripada
                // menggunakan agent { docker } yang rentan terhadap timeout heartbeat Jenkins (durable-task).
                // Menyertakan docker.sock agar Trivy bisa membaca image Docker lokal hasil build sebelumnya,
                // serta menggunakan Docker Named Volume untuk cache yang dijamin bebas konflik filesystem.
                sh """
                docker run --rm \
                  -v /var/run/docker.sock:/var/run/docker.sock \
                  -v trivy-cache-${APP_NAME}:/root/.cache/trivy \
                  aquasec/trivy:latest image \
                  --exit-code 1 \
                  --severity HIGH,CRITICAL \
                  ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('', 'docker-cred') {
                        docker.image("${IMAGE_NAME}:${IMAGE_TAG}").push()
                    }
                }
            }
        }

        stage('Deploy and Verify') {
            steps {
                script {
                    try {
                        sh """
                            helm upgrade --install ${APP_NAME} ./helm/charts \
                            -n ${NAMESPACE} \
                            --set image.name=${IMAGE_NAME}:${IMAGE_TAG}
                        """        
                        sh """
                            kubectl rollout status deployment/${APP_NAME} \
                            -n ${NAMESPACE} \
                            --timeout=180s
                        """
                    } catch (err) {
                        echo "Deployment failed. Rolling back ${APP_NAME}..."
                        
                        sh """
                            echo "Failed image: ${IMAGE_NAME}:${IMAGE_TAG}"
        
                            echo "Helm history before rollback:"
                            helm history ${APP_NAME} -n ${NAMESPACE} --max 3 || true
        
                            echo "Rolling back ${APP_NAME} to previous Helm revision..."
                            helm rollback ${APP_NAME} -n ${NAMESPACE} || {
                                echo "Rollback failed or not applicable"
                                exit 1
                            }
        
                            echo "Verifying rollback rollout..."
                            kubectl rollout status deployment/${APP_NAME} -n ${NAMESPACE} --timeout=180s || {
                                echo "Rollback executed, but deployment is still unhealthy."
                                kubectl get pods -n ${NAMESPACE} || true
                                exit 1
                            }
        
                            echo "Active image after rollback:"
                            kubectl get deployment ${APP_NAME} -n ${NAMESPACE} -o=jsonpath='{range .spec.template.spec.containers[*]}{.name}{": "}{.image}{"\\n"}{end}'
                        """
                        throw err
                    }
                }
            }
        }

    }

    post {
        success {
            echo "Pipeline succeeded! Image ${IMAGE_NAME}:${IMAGE_TAG} deployed."
        }
        failure {
            echo "Pipeline failed! No global rollback executed. Rollback only runs when deployment or rollout verification fails."
        }
        always {
            cleanWs(deleteDirs: true, disableDeferredWipeout: true)
        }
    }
}
