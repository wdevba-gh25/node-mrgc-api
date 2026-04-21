# Architecture-IaC

## Emergency Surge Demo, Azure DevOps + GitHub + Terraform + AKS

This diagram is intentionally high-level. It is meant to document the target flow of the showcase, not every low-level implementation detail.

```text
                                   +----------------------+
                                   |      GitHub Repos    |
                                   |----------------------|
                                   | emergency-surge-fe   |
                                   | emergency-surge-be   |
                                   | infra/terraform      |
                                   +----------+-----------+
                                              |
                                              | push / PR
                                              v
+-----------------------------------------------------------------------------------+
|                                Azure DevOps Project                               |
|-----------------------------------------------------------------------------------|
| Project: emergency-surge-platform                                                 |
| Pipeline: emergency-surge-aks-multistage                                          |
| Environments: dev / qa / prod                                                     |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
                        +---------------------------------------+
                        |      Multi-Stage Pipeline YAML        |
                        |---------------------------------------|
                        | 1. build_validate                     |
                        | 2. terraform_plan                     |
                        | 3. terraform_apply                    |
                        | 4. deploy_dev                         |
                        | 5. validate_dev                       |
                        | 6. deploy_qa                          |
                        | 7. validate_qa                        |
                        | 8. deploy_prod                        |
                        | 9. validate_prod                      |
                        +------------------+--------------------+
                                           |
              +----------------------------+----------------------------+
              |                                                         |
              v                                                         v
+-------------------------------+                        +----------------------------------+
|     Secrets / Configuration   |                        |         Terraform (IaC)          |
|-------------------------------|                        |----------------------------------|
| Azure DevOps secret vars      |                        | providers.tf                     |
| Variable Group                |                        | main.tf                          |
| Optional Azure Key Vault      |                        | variables.tf                     |
+---------------+---------------+                        | outputs.tf                       |
                |                                        | env tfvars                       |
                |                                        +----------------+-----------------+
                |                                                         |
                |                                                         v
                |                                  +----------------------------------------------+
                |                                  |              Azure Resources                  |
                |                                  |----------------------------------------------|
                |                                  | Resource Group: rg-emergency-surge-platform  |
                |                                  | ACR: acremergencysurge                       |
                |                                  | AKS: aks-emergency-surge                     |
                |                                  | Optional Key Vault                           |
                |                                  | TF State storage resources                   |
                |                                  +----------------+-----------------------------+
                |                                                   |
                |                                                   v
                |                            +---------------------------------------------------+
                |                            |                    AKS Cluster                     |
                |                            |---------------------------------------------------|
                |                            | Namespaces:                                       |
                |                            | - emergency-surge-dev                             |
                |                            | - emergency-surge-qa                              |
                |                            | - emergency-surge-prod                            |
                |                            +----------------+----------------------------------+
                |                                                   |
                |                                                   v
                |                        +-------------------------------------------------------+
                |                        |               Kubernetes Workloads                     |
                |                        |-------------------------------------------------------|
                |                        | frontend deployment + service                         |
                |                        | backend deployment + service                          |
                |                        | ingress, optional                                    |
                |                        +----------------+--------------------------------------+
                |                                                   |
                +---------------------------------------------------+
                                                                    |
                                                                    v
                                              +----------------------------------------+
                                              |   Validation / Health / Promotion      |
                                              |----------------------------------------|
                                              | frontend reachable                      |
                                              | backend /health                         |
                                              | environment promotion                   |
                                              | manual approval for prod, recommended   |
                                              | redeploy / rollback proof               |
                                              +----------------------------------------+
```

## Main Flow

1. Code lives in GitHub.
2. Azure DevOps orchestrates the full CI/CD flow.
3. Secrets come from Azure DevOps secret variables or optional Key Vault integration.
4. Terraform provisions the infrastructure.
5. Docker images are built and pushed to ACR.
6. AKS pulls and runs the workloads.
7. Dev, QA, and Prod are represented as Azure DevOps environments and AKS namespaces.
8. Validation, promotion, and recovery proof happen through the pipeline.

## Important Design Notes

- Terraform owns infrastructure state.
- AKS / Kubernetes handles application deployment and redeploy behavior.
- Azure DevOps environments provide deployment history, approvals, and promotion visibility.
- The architecture is intentionally compact, but it leaves room to evolve toward a more distributed model later if the product requires it.
