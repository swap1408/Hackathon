pipeline {
    agent any

    tools {
        jdk 'JDK17'
        maven 'Maven3'
    }

    environment {
        REGISTRY       = 'docker.io/swapnilneo'
        BACKEND_IMAGE  = 'hack-backend'
        FRONTEND_IMAGE = 'hack-frontend'
        PYTHON_IMAGE   = 'hack-python'
        TAG            = "${env.BUILD_NUMBER}"
        SSH_HOST       = 'ubuntu@172.31.17.237'
        DEPLOY_PATH    = '/home/ubuntu/hackathon'
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Verify Java & Maven') {
            steps {
                sh 'java -version'
                sh 'mvn -version'
            }
        }

        stage('Build Backend JAR') {
            steps {
                dir('backend') {
                    sh "mvn clean package -DskipTests"
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                script {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'docker-hub-creds',
                            usernameVariable: 'DOCKER_USER',
                            passwordVariable: 'DOCKER_PASS'
                        )
                    ]) {
                        sh """
                            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                            docker build -t $REGISTRY/$BACKEND_IMAGE:$TAG ./backend
                            docker build -t $REGISTRY/$FRONTEND_IMAGE:$TAG ./frontend
                            docker build -t $REGISTRY/$PYTHON_IMAGE:$TAG ./python

                            docker push $REGISTRY/$BACKEND_IMAGE:$TAG
                            docker push $REGISTRY/$FRONTEND_IMAGE:$TAG
                            docker push $REGISTRY/$PYTHON_IMAGE:$TAG
                        """
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    withCredentials([
                        sshUserPrivateKey(
                            credentialsId: 'ansible-ssh-key',
                            keyFileVariable: 'SSH_KEY'
                        )
                    ]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no -i $SSH_KEY $SSH_HOST '
                                cd $DEPLOY_PATH &&
                                docker compose down || true &&
                                docker compose pull &&
                                docker compose up -d --force-recreate
                            '
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment Successful!"
        }
        failure {
            echo "❌ Build or Deployment Failed!"
        }
    }
}
