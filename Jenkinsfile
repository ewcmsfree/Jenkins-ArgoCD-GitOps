pipeline {
	agent any
	tools {
		nodejs 'NodeJS'
	}
	environment {
		DOCKER_HUB_REPO = 'wuzhijun2023/gitops-app'
		DOCKER_HUB_CREDENTIALS_ID = 'gitops-dockerhub'
		K8S_SERVER_URL = 'https://k8s.home:6443'
		ARGOCD_SERVER_HOST = 'k8s.home:30412'
		ARGOCD_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJ3dXpoaWp1bjphcGlLZXkiLCJuYmYiOjE3NzEwNjA5NDcsImlhdCI6MTc3MTA2MDk0NywianRpIjoiamVua2lucyJ9.GddAcvHScXQkHVM14BpZcYNuD2dXIRowJDGpDMckTRQ'
	}
	stages {
		stage('Checkout Github'){
			steps {
				git branch: 'main', credentialsId: 'GitOps-token-GitHub', url: 'https://github.com/ewcmsfree/Jenkins-ArgoCD-GitOps.git'
			}
		}		
		stage('Install node dependencies'){
			steps {
				sh 'npm install'
			}
		}
		stage('Build Docker Image'){
			steps {
				script {
					echo 'building docker image...'
					dockerImage = docker.build("${DOCKER_HUB_REPO}:latest")
				}
			}
		}
		stage('Trivy Scan'){
			steps {
				// sh 'trivy image --severity HIGH,CRITICAL --no-progress --format json -o trivy-scan-report.txt ${DOCKER_HUB_REPO}:latest'
				sh 'trivy image --severity HIGH,CRITICAL --skip-db-update --no-progress --format json -o trivy-scan-report.txt ${DOCKER_HUB_REPO}:latest'
			}
		}
		stage('Push Image to DockerHub'){
			steps {
				script {
					echo 'pushing docker image to DockerHub...'
					docker.withRegistry('https://registry.hub.docker.com', "${DOCKER_HUB_CREDENTIALS_ID}") {
						dockerImage.push('latest')
					}
				}
			}
		}
		stage('Install Kubectl & ArgoCD CLI'){
		    steps {
		        sh '''
		            # 检查 kubectl 是否存在
		            if ! command -v kubectl &> /dev/null; then
		                echo "kubectl not found, installing..."
		                curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
		                sudo chmod +x kubectl
		                sudo mv kubectl /usr/local/bin/kubectl
		            else
		                echo "kubectl is already installed: $(kubectl version --client --short 2>/dev/null || echo 'version unknown')"
		            fi

		            # 检查 argocd 是否存在
		            if [ ! -f /usr/local/bin/argocd ]; then
		                echo "ArgoCD CLI not found, installing..."
		                sudo curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
		                sudo chmod +x /usr/local/bin/argocd
		            else
		                echo "ArgoCD CLI is already installed: $(argocd version --client --short 2>/dev/null || echo 'version unknown')"
		            fi
		        '''
		    }
		}
		stage('Apply Kubernetes Manifests & Sync App with ArgoCD'){
			steps {
				script {
					kubeconfig(credentialsId: 'k8s-config', serverUrl: "${K8S_SERVER_URL}") {
						sh '''
							# argocd login 192.168.0.230:30412 --username admin --password $(kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d) --insecure
							# argocd app sync argocdjenkins
							argocd app sync argocdjenkins --server ${ARGOCD_SERVER_HOST} --auth-token ${ARGOCD_AUTH_TOKEN} --insecure
						'''
					}
				}
			}
		}
	}

	post {
		success {
			echo 'Build and Deploy completed succesfully!'
		}
		failure {
			echo 'Build and Deploy failed. Check logs.'
		}
	}
}
