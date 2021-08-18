# Workforce management prototype based on MoJ Prototype Kit Template
Deployed here:https://workforce-management.apps.live-1.cloud-platform.service.justice.gov.uk/
U:allocations | P:digital

Currently focused on the new allocation journey.
Previous work can be seen at:https://github.com/ministryofjustice/hmpps-workforce-prototype


In addition to the protype kit v9.11.2, this repository contains:

### Files to build a docker image to run the prototype site

* Dockerfile
* .dockerignore
* start.sh

### A continuous deployment (CD) workflow, targeting the Cloud Platform

* .github/workflows/cd.yaml
* kubernetes-deploy.tpl
