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
		            # 定义安装目录
		            INSTALL_DIR="/usr/local/bin"

		            # 检查 kubectl
		            if command -v kubectl >/dev/null 2>&1; then
		                echo "--- kubectl 已存在，跳过安装 ---"
		            else
		                echo "--- 正在安装 kubectl ---"
		                curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
		                chmod +x kubectl
		                sudo mv kubectl $INSTALL_DIR/
		            fi

		            # 检查 argocd
		            if [ -f "$INSTALL_DIR/argocd" ]; then
		                echo "--- ArgoCD CLI 已存在，跳过安装 ---"
		            else
		                echo "--- 正在安装 ArgoCD CLI ---"
		                sudo curl -sSL -o $INSTALL_DIR/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
		                sudo chmod +x $INSTALL_DIR/argocd
		            fi
		            
		            # 最后验证一下版本
		            kubectl version --client
		            argocd version --client
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
