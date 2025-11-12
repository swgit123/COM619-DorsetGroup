deploy:
	${MAKE} -C BaseInfrastructure deployAll

undeploy:
	${MAKE} -C BaseInfrastructure undeployAll

deploydb:
	${MAKE} -C BaseInfrastructure deployCouchDB