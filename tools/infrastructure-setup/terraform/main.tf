resource "azurerm_resource_group" "this" {
  name     = "rg-elastic-training"
  location = var.location
}

resource "azurerm_kubernetes_cluster" "this" {
  name                = "aks-elastic-training"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  dns_prefix          = "elastic-training"
  sku_tier            = "Free"

  default_node_pool {
    name                 = "default"
    vm_size              = var.node_vm_size
    auto_scaling_enabled = true
    min_count            = var.node_min_count
    max_count            = var.node_max_count
    os_disk_size_gb      = 30
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "kubenet"
  }
}

resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true

  set {
    name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-health-probe-request-path"
    value = "/healthz"
  }

  depends_on = [azurerm_kubernetes_cluster.this]
}

resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true

  set {
    name  = "crds.enabled"
    value = "true"
  }

  depends_on = [azurerm_kubernetes_cluster.this]
}

resource "helm_release" "elastic_training" {
  name             = "elastic-training"
  chart            = "${path.module}/../helm/elastic-training"
  namespace        = "elastic-training"
  create_namespace = true

  set {
    name  = "replicaCount"
    value = tostring(var.elastic_replicas)
  }

  set {
    name  = "domain"
    value = var.domain
  }

  set {
    name  = "letsencryptEmail"
    value = var.letsencrypt_email
  }

  set_sensitive {
    name  = "elasticPassword"
    value = var.elastic_password
  }

  depends_on = [
    helm_release.ingress_nginx,
    helm_release.cert_manager,
  ]
}
