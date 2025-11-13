pipeline {
  agent any

  environment {
    REGISTRY = "swapnilneo"                     // <-- your Docker Hub username
    FRONTEND_IMAGE = "hack-frontend"
    BACKEND_IMAGE  = "hack-backend"
    PYTHON_IMAGE   = "hack-python"
    TAG = "v${env.BUILD_NUMBER}"                // release tag (e.g. v42)
    EC2_USER = "ubuntu"
    EC2_HOST = "15.207.120.201"
    REMOTE_DIR = "/home/ubuntu/hackathon"
    HEALTHCHECK_URL = "http://${EC2_HOST}:8080/actuator/health"  // adjust if different
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build backend') {
      steps {
        dir('backend') {
          sh './gradlew clean bootJar -x test'
        }
      }
    }

    stage('Build & Push Docker Images') {
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
        sshagent (credentials: ['ec2-ssh-key']) {
          script {
            // 1) Record currently deployed image tags (for rollback)
            sh """
            ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} <<'SSH_EOF'
set -e
cd ${REMOTE_DIR} || exit 1

# Ensure we have a place to save last-deployed mapping
mkdir -p .deploy
# gather currently used image refs from docker-compose (if present)
# We prefer reading running containers' image names (if containers exist)
echo "Recording current images to .deploy/last_deployed.env"
/usr/bin/docker ps --format '{{.Names}} {{.Image}}' | grep -E '${FRONTEND_IMAGE}|${BACKEND_IMAGE}|${PYTHON_IMAGE}' || true \
  > .deploy/current_containers.txt

# Convert to KEY=IMAGE format
: > .deploy/last_deployed.env
while read -r line; do
  name=$(echo "$line" | awk '{print $1}')
  image=$(echo "$line" | awk '{print $2}')
  if echo "$image" | grep -q '${FRONTEND_IMAGE}'; then echo "FRONTEND_IMAGE='$image'" >> .deploy/last_deployed.env; fi
  if echo "$image" | grep -q '${BACKEND_IMAGE}'; then echo "BACKEND_IMAGE='$image'" >> .deploy/last_deployed.env; fi
  if echo "$image" | grep -q '${PYTHON_IMAGE}'; then echo "PYTHON_IMAGE='$image'" >> .deploy/last_deployed.env; fi
done < .deploy/current_containers.txt

# If file empty, try to capture images from docker-compose.yml as a fallback
if [ ! -s .deploy/last_deployed.env ]; then
  echo "No running containers found; capturing from docker-compose.yml"
  grep -E 'image:\\s*' docker-compose.yml | sed -E "s/\\s*image:\\s*//" | awk -F':' '{name=$1; tag=$2; print toupper(name)\"_IMAGE=\" $0 }' >> .deploy/last_deployed.env || true
fi

cat .deploy/last_deployed.env || true
SSH_EOF
"""
            // 2) Update docker-compose.yml with new image tags (in-place)
            sh """
            ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} <<'SSH_EOF'
set -e
cd ${REMOTE_DIR} || exit 1

# Backup original compose
cp docker-compose.yml docker-compose.yml.bak

# Replace image tags for each service (safe sed edits)
# This replaces the part after the image name with the new tag
# Example: swapnilneo/hack-backend:old -> swapnilneo/hack-backend:${TAG}
sed -E -i "s|(image:.*${REGISTRY}/${FRONTEND_IMAGE}):.*|\\1:${TAG}|g" docker-compose.yml || true
sed -E -i "s|(image:.*${REGISTRY}/${BACKEND_IMAGE}):.*|\\1:${TAG}|g" docker-compose.yml || true
sed -E -i "s|(image:.*${REGISTRY}/${PYTHON_IMAGE}):.*|\\1:${TAG}|g" docker-compose.yml || true

# For safety, if images are specified without registry prefix, attempt to set them
# (e.g., image: hack-frontend -> swapnilneo/hack-frontend:${TAG})
sed -E -i "s|image:\\s*${FRONTEND_IMAGE}(:.*)?|image: ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}|g" docker-compose.yml || true
sed -E -i "s|image:\\s*${BACKEND_IMAGE}(:.*)?|image: ${REGISTRY}/${BACKEND_IMAGE}:${TAG}|g" docker-compose.yml || true
sed -E -i "s|image:\\s*${PYTHON_IMAGE}(:.*)?|image: ${REGISTRY}/${PYTHON_IMAGE}:${TAG}|g" docker-compose.yml || true

echo "Updated docker-compose.yml to new tags:"
grep -E 'image:' docker-compose.yml || true

# Pull new images and update
sudo docker compose pull
sudo docker compose up -d
SSH_EOF
"""
          } // end script
        } // end sshagent
      } // end steps
    } // end stage

    stage('Healthcheck & Verify') {
      steps {
        script {
          // try healthcheck several times with backoff
          def success = false
          for (int i = 0; i < 8; i++) {
            def code = sh(script: "curl -s -o /dev/null -w '%{http_code}' ${HEALTHCHECK_URL} || true", returnStdout: true).trim()
            echo "Healthcheck attempt ${i+1} -> HTTP ${code}"
            if (code == '200') { success = true; break }
            sleep(time: 5, unit: 'SECONDS')
          }
          if (!success) {
            error "Healthcheck failed after retries"
          } else {
            echo "Healthcheck OK"
          }
        }
      }
    }
  } // end stages

  post {
    failure {
      script {
        echo "Deployment failed — starting rollback to previous images"

        sshagent (credentials: ['ec2-ssh-key']) {
          sh """
          ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} <<'SSH_EOF'
set -e
cd ${REMOTE_DIR} || exit 1

if [ -f .deploy/last_deployed.env ]; then
  echo "Rolling back using .deploy/last_deployed.env"
  # shellcheck disable=SC1090
  . .deploy/last_deployed.env

  # If variables exist, inject them back into docker-compose.yml
  if [ ! -z "${FRONTEND_IMAGE:-}" ]; then
    sed -E -i "s|image:.*${REGISTRY}/${FRONTEND_IMAGE}:.*|image: ${FRONTEND_IMAGE}|g" docker-compose.yml || true
  fi
  if [ ! -z "${BACKEND_IMAGE:-}" ]; then
    sed -E -i "s|image:.*${REGISTRY}/${BACKEND_IMAGE}:.*|image: ${BACKEND_IMAGE}|g" docker-compose.yml || true
  fi
  if [ ! -z "${PYTHON_IMAGE:-}" ]; then
    sed -E -i "s|image:.*${REGISTRY}/${PYTHON_IMAGE}:.*|image: ${PYTHON_IMAGE}|g" docker-compose.yml || true
  fi

  echo "Pulling and restoring old images..."
  sudo docker compose pull || true
  sudo docker compose up -d || true

  echo "Rollback finished. Restore compose backup if you need manual inspection."
else
  echo "No .deploy/last_deployed.env found. Attempting to restore docker-compose.yml.bak"
  if [ -f docker-compose.yml.bak ]; then
    mv docker-compose.yml.bak docker-compose.yml
    sudo docker compose up -d || true
    echo "Restored docker-compose.yml.bak"
  else
    echo "Nothing to rollback to."
  fi
fi

SSH_EOF
"""
        } // end sshagent
      } // end script
    }

    success {
      echo "Deployment succeeded: ${TAG}"
    }

    always {
      echo "Pipeline finished"
    }
  }
}
