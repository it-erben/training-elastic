variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
  default     = "30b490cd-637c-4934-87a7-a38eba455adf"
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "westeurope"
}

variable "node_vm_size" {
  description = "VM size for AKS node pool"
  type        = string
  default     = "Standard_B2s_v2"
}

variable "node_min_count" {
  description = "Minimum number of nodes in the pool"
  type        = number
  default     = 1
}

variable "node_max_count" {
  description = "Maximum number of nodes in the pool"
  type        = number
  default     = 5
}

variable "elastic_replicas" {
  description = "Number of ES+Kibana pod replicas (one per trainee)"
  type        = number
  default     = 1
}

variable "elastic_password" {
  description = "Password for the Elasticsearch 'elastic' superuser"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "Domain name for HTTPS access (e.g. training.example.com)"
  type        = string
  default     = "elastic-training.erben.tech"
}

variable "letsencrypt_email" {
  description = "Email address for Let's Encrypt certificate registration"
  type        = string
  default     = "alex@it-erben.com"
}
