# Installation Instructions

The application can be installed locally or deployed in the cloud.

## Local deployment

If a local deployment is preferred, the following applications are required:

- Docker Desktop
    - [Windows](https://docs.docker.com/desktop/install/windows-install/)
    - [Linux](https://docs.docker.com/desktop/install/linux-install/)
    - NOTE: For Linux, please check requirements specific to your distro
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (if not using MongoDB Atlas) 

After downloading the required software:

1. Install Docker Desktop.
2. Extract the file named AnimoPlan.zip to a new folder.
3. Open a terminal with administrator privileges and change the current directory to the newly created folder.
4. Run the command `docker build -t <image_name> .` to build the application. Replace `<image_name>` with an appropriate name.
5. To make passing of environmental variables easier, create a new .env file from the .env.example file provided.
6. Change the variables as follows:
    * `MONGODB_URL` - use the connection string provided by the server. Make sure that the database is accessible from within the Docker container.
    * `PORT` - In most cases, this is not required as the port configuration on the Docker container decides the port that is accessible to end users.
    * `SESSION_VALIDITY` - how long since login, not last activity, the user's session should be valid for, in minutes.
7. Run the command `docker run --name <container_name> --env-file <env_file> -p <external_port>:<internal_port> <image_name> yarn serve`, where:
    * `container_name` - is an appropriate name for the container
    * `env_file` - the path to the .env file created
    * `external_port` - the port to be exposed to outside users
    * `internal_port` - the port used in the `PORT` environment variable
    * `image_name` - the image name used in the build command

## Cloud-based deployment

For cloud-based deployments, please make sure that your cloud service provider has Docker support. Please consult your provider on how to push Docker images to the cloud.

Docker Desktop may be needed to push images to the cloud.
- [Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Linux](https://docs.docker.com/desktop/install/linux-install/)
