output "kube_config" {
  description = "Kubeconfig for the AKS cluster (use: terraform output -raw kube_config > ~/.kube/config)"
  value       = azurerm_kubernetes_cluster.this.kube_config_raw
  sensitive   = true
}

output "ingress_ip" {
  description = "Public IP of the NGINX Ingress Controller (create a DNS A record pointing your domain here)"
  value       = data.kubernetes_service.ingress_nginx.status[0].load_balancer[0].ingress[0].ip
}

output "access_urls" {
  description = "Kibana access URLs for each trainee"
  value = [
    for i in range(var.elastic_replicas) :
    "https://${var.domain}/${i}/"
  ]
}

data "kubernetes_service" "ingress_nginx" {
  metadata {
    name      = "ingress-nginx-controller"
    namespace = "ingress-nginx"
  }

  depends_on = [helm_release.ingress_nginx]
}
