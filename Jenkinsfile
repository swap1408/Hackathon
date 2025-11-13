pipeline {
    agent any

    environment {
        REGISTRY = "swapnilneo"
        FRONTEND_IMAGE = "hack-frontend"
        BACKEND_IMAGE  = "hack-backend"
        PYTHON_IMAGE   = "hack-python"
        TAG = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Code') {
            steps { checkout scm }
        }

        stage('Build Backend JAR') {
            steps {
                dir('backend') {
                    sh './gradlew clean bootJar'
                }
            }
        }

        stage('Build & Push Images') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-creds') {

                        dir('frontend') {
                            sh "docker build -t ${REGISTRY}/${FRONTEND_IMAGE}:${TAG} ."
                            sh "docker push ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}"
                        }

                        dir('backend') {
                            sh "docker build -t ${REGISTRY}/${BACKEND_IMAGE}:${TAG} ."
                            sh "docker push ${REGISTRY}/${BACKEND_IMAGE}:${TAG}"
                        }

                        dir('python') {
                            sh "docker build -t ${REGISTRY}/${PYTHON_IMAGE}:${TAG} ."
                            sh "docker push ${REGISTRY}/${PYTHON_IMAGE}:${TAG}"
                        }
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@15.207.120.201 '
                    
                        cd /home/ubuntu/hackathon

                        echo "📌 Saving current compose file for rollback"
                        cp docker-compose.yml docker-compose.yml.bak

                        echo "🔄 Updating images to new versions"

                        sudo sed -i "s|image: .*hack-frontend.*|image: ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}|" docker-compose.yml
                        sudo sed -i "s|image: .*hack-backend.*|image: ${REGISTRY}/${BACKEND_IMAGE}:${TAG}|" docker-compose.yml
                        sudo sed -i "s|image: .*hack-python.*|image: ${REGISTRY}/${PYTHON_IMAGE}:${TAG}|" docker-compose.yml

                        echo "⬇ Pulling new images"
                        sudo docker compose pull || exit 1

                        echo "🚀 Restarting services"
                        sudo docker compose up -d || exit 1

                        echo "⏳ Waiting 8 seconds before health check"
                        sleep 8

                        echo "🔍 Testing backend health"
                        curl -f http://localhost:8080/api/v1/seed || (echo "❌ Backend failed. Rolling back..." && cp docker-compose.yml.bak docker-compose.yml && sudo docker compose up -d && exit 1)

                        echo "✅ Deployment successful!"
                    '
                    """
                }
            }
        }
    }

    post {
        success { echo "🎉 Build & Deploy completed successfully!" }
        failure { echo "❌ Build or Deploy failed!" }
    }
}
