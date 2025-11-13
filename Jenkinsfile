pipeline {
    agent any

    environment {
        REGISTRY = "docker.io/swapnilneo"
        BACKEND_IMAGE = "hack-backend"
        FRONTEND_IMAGE = "hack-frontend"
        PYTHON_IMAGE = "hack-python"

        SSH_KEY = credentials('ansible-ssh-key')
        DOCKER_CREDS = credentials('docker-hub-creds')
        EC2_USER = "ubuntu"
        EC2_HOST = "15.207.120.201"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend JAR (Maven)') {
            steps {
                dir("backend") {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                script {
                    sh """
                        echo "Logging into Docker Hub"
                        echo "$DOCKER_CREDS_PSW" | docker login -u "$DOCKER_CREDS_USR" --password-stdin

                        docker build -t $REGISTRY/$BACKEND_IMAGE:\$BUILD_NUMBER backend/
                        docker build -t $REGISTRY/$FRONTEND_IMAGE:\$BUILD_NUMBER frontend/
                        docker build -t $REGISTRY/$PYTHON_IMAGE:\$BUILD_NUMBER python/

                        docker push $REGISTRY/$BACKEND_IMAGE:\$BUILD_NUMBER
                        docker push $REGISTRY/$FRONTEND_IMAGE:\$BUILD_NUMBER
                        docker push $REGISTRY/$PYTHON_IMAGE:\$BUILD_NUMBER
                    """
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    sh """
                    ssh -o StrictHostKeyChecking=no -i $SSH_KEY $EC2_USER@$EC2_HOST '
                        cd /home/ubuntu/hackathon &&
                        sed -i "s|hack-backend:.*|hack-backend:\$BUILD_NUMBER|g" docker-compose.yml &&
                        sed -i "s|hack-frontend:.*|hack-frontend:\$BUILD_NUMBER|g" docker-compose.yml &&
                        sed -i "s|hack-python:.*|hack-python:\$BUILD_NUMBER|g" docker-compose.yml &&
                        docker-compose pull &&
                        docker-compose up -d
                    '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✔ Deployment Successful!"
        }
        failure {
            echo "❌ Build or Deploy Failed!"
        }
    }
}
