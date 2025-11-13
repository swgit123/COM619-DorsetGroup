deploy:
	${MAKE} -C BaseInfrastructure deployAll

undeploy:
	${MAKE} -C BaseInfrastructure undeployAll

deploydb:
	${MAKE} -C BaseInfrastructure deployCouchDB

buildApp:
	${MAKE} -C BaseInfrastructure buildApp

deployApp:
	${MAKE} -C BaseInfrastructure deployApp
 
undeployApp:
	${MAKE} -C BaseInfrastructure undeployApp