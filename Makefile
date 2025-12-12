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
 
updateApp:
	${MAKE} -C BaseInfrastructure updateApp

undeployApp:
	${MAKE} -C BaseInfrastructure undeployApp

undeploydb:
	${MAKE} -C BaseInfrastructure undeployCouchDB

debug:
	@kubectl run debug-curl --rm -it --image=curlimages/curl --restart=Never -- sh