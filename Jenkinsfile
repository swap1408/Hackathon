pipeline {
    agent any

    environment {
        REGISTRY = "docker.io/swapnilneo"
        BACKEND_IMAGE = "hack-backend"
        FRONTEND_IMAGE = "hack-frontend"
        PYTHON_IMAGE = "hack-python"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend JAR') {
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh '''
                        echo "${PASS}" | docker login -u "${USER}" --password-stdin

                        docker build -t ${REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG} backend
                        docker build -t ${REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG} frontend
                        docker build -t ${REGISTRY}/${PYTHON_IMAGE}:${IMAGE_TAG} python

                        docker push ${REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${REGISTRY}/${PYTHON_IMAGE}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(['ansible-ssh-key']) {
                    sh '''
                      ssh -o StrictHostKeyChecking=no ubuntu@15.207.120.201 '
                        cd hackathon &&
                        docker-compose pull &&
                        docker-compose down &&
                        docker-compose up -d
                      '
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Deployment Successful!"
        }
        failure {
            echo "❌ Build or Deploy Failed!"
        }
    }
}
