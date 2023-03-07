## 0032_1_Demo_Overview_Node_js_Project_Overview
### real-life pipeline demo overview:
Now you know these:
![img.png](../img/section-3/0032_1-1.png)

In the script sections(or main logic of the pipeline) we're gonna building and packaging an actuall app.
![img.png](../img/section-3/0032_1-2.png)

![img.png](../img/section-3/0032_1-3.png)

### complete demo overview:
We're gonna build a pipeline for a nodejs app.

For building the pipeline, we're gonna do:
1) First, we're gonna run unit tests for the app which are the simplest tests that just test the code itself
![img.png](../img/section-3/0032_1-4.png)
2) we're also gonna run a static application security testing which is scanning our code for any security issues 
![img.png](../img/section-3/0032_1-5.png)
3) then we're gonna build a docker image from our app using the Dockerfile we have
![img.png](../img/section-3/0032_1-6.png)
4) then push that image to a docker registry that gitlab provides. So we have a built-in docker registry in gitlab for each project
![img.png](../img/section-3/0032_1-7.png)
5) once we push that image, we're gonna deploy it to a development server. For this, we're gonna create another simple EC2 instance on AWS and we're gonna
use that as a development server to deploy and run the image that we built for our app 
![img.png](../img/section-3/0032_1-8.png)
6) once we have the image running on development server, we're gonna promote a new application version to staging or test environment and then to production environment 
![img.png](../img/section-3/0032_1-9.png)

In this section we're gonna do these steps of all of the steps(we skip the security tests in this section):
![img.png](../img/section-3/0032_1-10.png)

And in part of real life pipeline, we're also gonna see how to increment and set the image version of our application, dynamically in the pipeline instead of hard coding it
in the code and note that for the whole demo, we're gonna use the free version of the gitlab CI/CD to build this thing.
![img.png](../img/section-3/0032_1-11.png)

### overview of node application:
Note: 
.gitlab-ci.yml = containing our CI/CD configuration
Dockerfile = Consists of instructions to build the docker image

junit includes the test results in machine readable way and we can put it in .gitignore to exclude it to being on repo.

Now we want to build the project and deploy it on an EC2 server using the gitlab CI/CD pipeline.

**In workflow section of ci config, we say this pipeline will only run either for main branch or for merge requests(for all the feature branches, it will be ignored).**

## 0033_2_Run_Unit_Tests_Collect_Test_Reports
### run unit tests:
we're gonna run this job on our self-managed runner which has the docker executor, by specifying tags attr.

Before we're able to run npm commands, we have to first go to `app` folder, because that's where we have package.json .
Also we had to run npm install before running tests.
We can include these in `before_script` attr.

Now since we're using npm, we need to install it inside our docker container. For this, we're gonna use an image that has npm command in it. So let's define
`image` attr for `run_unit_tests` job.

So we're executing our unit tests using npm test command inside a docker container with node image.

Now push to gitlab to test this(you could use the gitlab's CI/CD editor too).

### configure test report:
Currently, we only see the test results inside logs of the job. To see the results, we have to go to gitlab job page and see those logs. But we don't have
an overview of the test executions inside the gitlab UI(tests tab in a pipeline page).

Currently we don't see any reports in tests tab of a pipeline and also in the list view of pipelines(/pipelines page), if you click on the 3 dots icon of pipeline that you just ran,
we have no artifacts(`no artifacts found) for the test reports.

So how do we use those test reports that we generated using jest, to show them in gitlab? Or how do we make gitlab use those reports and visualize them for us
in the UI?
We can configure a job to use the unit test reports that jest generates for us, so the gitlab can display it for us and to do this, use `artifacts` attr in the job.
Let's use it in `run_unit_tests` job.

![img.png](../img/section-3/0033_2-1.png)
![img.png](../img/section-3/0033_2-2.png)

1) Junit report will collect the junit reports from xml files. 
2) Those collected unit test reports will be uploaded to gitlab as an artifact(that's why we're using the artifacts attr).
3) then gitlab will be able to visualize it in it's UI.
![img.png](../img/section-3/0033_2-3.png)

Junit was originally developed for java. However, there are many 3rd party libraries to generate junit format test reports for other langs like js, python, ruby and ... and
jest-junit library is the one that lets us generate the JS test reports in junit format. Note that the reports must be in xml format.

Now we want those reports to be uploaded as artifacts, not only when the tests are passed, but also when the tests fail and for that we need to add a condition
in artifacts attr using `when`, to say: `when: always`. So even when tests fail, please upload those reports to see the failures of the test.

With this config, we should see test reports in gitlab UI as well.

So trigger the pipeline to see this in tests tab:
![img.png](../img/section-3/0033_2-4.png)

and also in the list view of the pipelines and in artifacts button(that 3 dots icon), we see we have an artifact that we can download and it's gonna be(in this case), our
junit.xml file(contains the test results) and this is the file that gitlab uses to generate those UI overviews for your tests.
![img.png](../img/section-3/0033_2-5.png)

If we want to make the downloadable test reports, browsable, which means the folder structure and everything, we can add `paths` attr to `artifacts` and add the
junit report there and this is good, if you have multiple test reports that you want to organize and not have them all in one place.

![img.png](../img/section-3/0033_2-6.png)
![img.png](../img/section-3/0033_2-7.png)

### test reports in the development process:
Let's say while a dev is working, he accidentally deleted the Dockerfile. Now he wants to create a merge request and they didn't notice Dockerfile was deleted.
So the test that validates whether Dockerfile exists, will fail and in MR we will have:
![img.png](../img/section-3/0033_2-8.png)
and in the image above, we can see the names of the tests that failed(the one that says: `Dockerfile exists`).
![img.png](../img/section-3/0033_2-9.png)
With this, we can see an overview of what tests are failing because of our MR. So we and other devs that are reviewing the MR, can see what tests failed as a result of
your MR.

That's another feature of gitlab using test reports.

That's how you can run unit tests in your CI/CD pipeline for a nodejs app.

## 0034_3_Build_Docker_Image_Push_to_Private_Registry:
### build and push docker images:

### gitlab's container registry:
Gitlab offers a built-in docker registry for every project.
![img.png](../img/section-3/0034_3-1.png)
![img.png](../img/section-3/0034_3-2.png)
![img.png](../img/section-3/0034_3-3.png)

To see the docker registry of gitlab for your project, go to `Packages & registries>Container registry`. In Packages & registries, we have 3 types of registries.

Package registry is for general purpose artifacts like zip files, or jar files and ...(depending on programming languages and tools that you're using) and they can be used
by other projects as deps.
![img.png](../img/section-3/0034_3-4.png)

![img.png](../img/section-3/0034_3-5.png)
![img.png](../img/section-3/0034_3-6.png)

Note about registries and how to push images to a registry, is that the desitanion or the registry location where you want to push that image, is actually in the name
of the image itself. So when we build and tag an image(give it a name), we include the registry address or location in the image name. So that docker knows to which
registry, it should push that image.
![img.png](../img/section-3/0034_3-7.png)

For every gitlab project, it will have it's own registries and the name of the docker registry for that project, would be:
registry.gitlab.com(which is gitlab registry url)/<your username>/<the name of your project>. This is the name of our container registry.
![img.png](../img/section-3/0034_3-8.png)

The third type of registry that gitlab provides, is infrastructure registry which is a private registry for infra as code packages and in this case, specifically for
terraform. So you can write your own terraform modules for infra provisioning which is related to that project or app and you can host it there.
![img.png](../img/section-3/0034_3-9.png)

Note about securing your registry: When you have a private project, only members of the project have access to that registry. So you can manage the permissions
and access to your docker registry based on access to the project and if you make your project public, then you container registry also becomes public.
![img.png](../img/section-3/0034_3-10.png)

### build docker image:
Let's write a job that will build our image and name it build_image and this job will run on our managed gitlab runner, but with shell executor(so pick a runner
with shell executor) and remember that we have installed docker on our gitlab runner on ec2 instance, so we have docker command available there.

Note: For building the docker image, you don't have to first login to the registry. We need to login to push the image.

We also want to add a version tag for an image, so add a colon at the end of the name and then the version.
![img.png](../img/section-3/0034_3-11.png)
![img.png](../img/section-3/0034_3-12.png)

### push docker image:
Create push_image job We could do both building and pushing in one job.

**Note: Currently our jobs will run in parallel but we don't want that. We want to run some of them in sequence. So let's define some stages.** 
We're gonna have a test stage and a build stage.

![img.png](../img/section-3/0034_3-13.png)

Currently both build_image and push_image are in build stage and will run after the run_unit_tests, but still in parallel with each other, however
we want the push image to wait until build_image job gets done(so we want a job to wait for success of another job which are in the same stage).
**So we use `needs` attr for the job we want it to wait for another.**

![img.png](../img/section-3/0034_3-14.png)
Where do we get credentials for our private registry?
There are multiple ways to authenticate: one of them is username and password, another one is personal access token

Now how do we get those username and password for our registry?
Another cool feature of gitlab is that in a CI/CD pipeline, gitlab provides temporary credentials(username and password), for our container registry through
env variables. So we have the username and password for our private registry available inside the CI/CD pipeline using those predefined gitlab CI/CD env variables
and we have a predefined env variable list where we gitlab makes available within the pipeline.
And this username and pass as env variables is good in terms of security the way gitlab does it, because the way it works is that gitlab will generate those two and 
make them available only for that specific pipeline execution or the job execution. So the username and password env variables are valid as long as the job is running,
so even if the password gets leaked, it cannot be used again. We're gonna use these variables as credentials in our `docker login ...` command.

We reference env variables using $.
![img.png](../img/section-3/0034_3-15.png)
![img.png](../img/section-3/0034_3-16.png)

Now, if you run the push_image job(which runs in the execution of pipeline):
![img.png](../img/section-3/0034_3-17.png)

Till now, we have done these:
![img.png](../img/section-3/0034_3-18.png)

To pull the pushed docker image, you can grab the full name of the image(including the tag) using that copy button in list of images in container registry of gitlab.

### improve pipeline configuration:
Let's do some optimization to our pipeline. We see that we're using the image name in multiple places with the image tag and it;'s hard coded and also the
registry name is also hard coded(gitlab.registry.com). 

We can use the $CI_REGISTRY which is registry.gitlab.com value and $CI_REGISTRY_IMAGE which is the complete value of image name(which inside of it has registry.gitlab.com or 
gitlab registry url inside of it **but it doesn't have the version tag of image**).

All these env variables are injected by gitlab into our pipeline, so we can reference them using the env variables, so we don't have to repeat or hard code them in our
pipeline code.
![img.png](../img/section-3/0034_3-19.png)
![img.png](../img/section-3/0034_3-20.png)

### multiple image repositories:
Currently in the container registry, if you see the pushed image, you see <username>/<project name>/Root image.
Why do we have /Root image in url?
This means that in our container registry, we can have multiple image repos and for each image repo, we can have multiple tags or versions.
For example, we may have a project that builds multiple apps like a microservices apps and each microservice app will have it's own image repo name.
For example we may have: <my node>/<app project>/payment-service or <my node>/<app project>/user-authentication or <my node>/<app project>/shopping-cart. So instead of 
having everything in Root image which is the main bucket or main namespace for all the image tags, we can have multiple image repos and each one can have it's own
tags.
![img.png](../img/section-3/0034_3-21.png)
![img.png](../img/section-3/0034_3-22.png)
![img.png](../img/section-3/0034_3-23.png)

So `Root image` is the global level where all the image tags will be pushed, however, if we copy that image name that has Root image, it will not contain the Root image in the
copied url, it will just have the name of the project in the end and then we can append a version tag. like `:1.0`.

Now let's say we actually want to give our image a hierarchy and give it some microservice-specific name. So instead of this as image name:
`registry.gitlab.com/parsa/project-name:1.0`, we want to give it a name like: `registry.gitlab.com/parsa/project-name/microservice/payment:1.0`.
For this, append these new names to `$CI_REGISTRY_IMAGE`.

After the pipeline ran, in container registry we would have:
![img.png](../img/section-3/0034_3-24.png)
Which means a new image repo was added with a name that we defined, instead of `Root image` and insde that new image repo, we have: 
![img.png](../img/section-3/0034_3-25.png)
Now if we copy that image name with the copy button, we would have:
![img.png](../img/section-3/0034_3-26.png)
which is the full name of our image.

Now let's use a variable for that microservice name that we appended.

Now after you commit the new changes to ci config, it will run the pipeline automatically, but we don't want that. Because we want to specify the value of some env
variables($MICRO_SERVICE). So cancel the running pipeline and instead use `Run pipeline` button which is in `pipelines` page(list of pipelines) which then says we're running the
pipeline for branch `main`:
![img.png](../img/section-3/0034_3-27.png)
So this was another way of passing variables in a flexible way to a pipeline, as an alternative to defining them globally in the settings>ci-cd variables section:
![img.png](../img/section-3/0034_3-28.png)
Obviously, triggering the pipeline manually and passing the variables is not convenient when you want to trigger the pipeline automatically.

Now we have another image rep(hovered in image), with shopping-cart in the name
![img.png](../img/section-3/0034_3-29.png)

Let's make the image repo name as a variable named `IMAGE_NAME` and also a `IMAGE_TAG` variable.

shopping-cart image repo with 2 tags:
![img.png](../img/section-3/0034_3-30.png)

This is how you push docker images from CI/CD pipeline to your project's container registry.

## 0035_4_Deploy_to_DEV_Server:
After pushing the image from pipeline to gitlab container registry, we can deploy it to a development server.
![img.png](../img/section-3/0035_4-1.png)
![img.png](../img/section-3/0035_4-2.png)

Let's add another job called `delpoy_to_dev`. What do we need in order to deploy our docker image that we build and push from our pipeline, to a development server?
Well, first we need a development server!

### create and configure a server to deploy to:
Right now, we have a gitlab runner on our EC2 instance and let's tag our runner there:
![img.png](../img/section-3/0035_4-3.png)

Now let's create another EC2 instance which is gonna be our deployment server for development environment.
So click on `launch instance`.
![img.png](../img/section-3/0035_4-4.png)
![img.png](../img/section-3/0035_4-5.png)
![img.png](../img/section-3/0035_4-6.png)
![img.png](../img/section-3/0035_4-7.png)

Let's create a new key pair for this one and call it `dev-server-key` and click on `download key pair` button. Because we need that privaate key available to, to be able
to SSH with it.
![img.png](../img/section-3/0035_4-8.png)

![img.png](../img/section-3/0035_4-9.png)

On the dev server, when we deploy the docker image and run it as a container, we need to have docker available.
![img.png](../img/section-3/0035_4-10.png)

For this, we're gonna SSH into our dev server(with that downloaded private key, but first(before SSH), we need to secure or restrict the access to that
key, first) and install docker on it.
![img.png](../img/section-3/0035_4-11.png)

Secure or restrict the access to the private key of new instance: `chmod 400 <path to pem file which contains private key of new instance>`.

Now SSH into the new instance using that private key: `ssh -i <path tp pem file> <username like ubuntu>@<public IP address like 35.180.46.122>`.
Now we're inside our dev server. 

Run docker. It would show an error with a command for installing docker. Run that command but first run: `sudo apt update`.

After docker is installed, we can not still run docker commands(like docker ps). Because we need to give that user, the permission to execute docker which is done by adding
the ubuntu user to docker group: `sudo usermod -aG docker <the username like ubuntu in this case>`.

Now logout using `exit` and then login again by running ssh command. Now ubuntu user should be able to execute docker commands.

That's all we needed to do on development server in order to be able to pull the image from our gitlab private repo and then run that image as a docker container.

Our job on dev server is done, run `exit`.

### Connect to development server from CI/CD pipeline:
How do we connect from gitlab pipeline to the dev server instance?

![img.png](../img/section-3/0035_4-12.png)

The way we did it locally is that we SSHed into it using the private key by for example saying:
`ssh -i <path to the pem file or private key of instance> <username of user in server(username could be ubuntu)>@<public IP address like 35.180.46.122>`.
So we need these info(private key, username, IP address and ...) so that gitlab can SSH into the dev server. Which means we need to provide gitlab, the private key that
we have available.


How do we provide gitlab a private key of a server?
In gitlab go to settings>CI/CD and in the variables section, we're gonna create a secret variable.
![img.png](../img/section-3/0035_4-13.png)

Let's call it `SSH_PRIVATE_KEY` and the value would be the content of the ssh private key file that you got from EC2 instance and you can get it by running:
`cat <path to the pem file>`. Copy the whole things(including the lines that look like comments) until the percentage character at the very end(we don't need that one) and paste 
it in value.

Checking protected variable checkbox means that it's only exposed to protected branches or protected tags, like the default main branch for example and all the feature branches.
![img.png](../img/section-3/0035_4-14.png)

We also have a checkbox for mask variable and you should check this for any secret data like a private key and the way it works is that it lets you use 
the variable in job scripts without the risk of exposing the value of the variable. So if someone tries to output it in the job log with a command like `echo $<variable name>`,
the job would only show the `echo <masked output>` which is sth we want for secret values. However, there is a limitation in gitlab when it comes to the **private keys** and it means
that we can **not** mask variables with these values and that has to do with the fact that `mask variable` has some strict rules about what type of
content you can mask and it is kind of a known issue or known limitation of gitlab. So we're gonna have to leave this protected checkbox for private keys, as unchecked(so it would
be unmasked). So right now we cannot mask it. However just know that whenever we're using secret values like password or token(anything other than private keys), we would mask that by
checking that checkbox. Then change the type of value to `file`. Because we want our private key as a file, so that we can pass it like:
`ssh -i <path to private key file> ...`

![img.png](../img/section-3/0035_4-16.png)
![img.png](../img/section-3/0035_4-17.png)
![img.png](../img/section-3/0035_4-18.png)
![img.png](../img/section-3/0035_4-19.png)

Now we have that private key available for gitlab in pipeline and we can use that to SSH into the dev server.

First ssh into dev server, then do docker login in order to be able to push the image from the gitlab's private repo and then pull and then run the image as a docker container.
![img.png](../img/section-3/0035_4-20.png)

For this, create a new job named `deploy_to_dev` and add a new stage named `deploy` and also add it to `stages` key and execute this new job on gitlab runner with shell
executor by specifying tags of runner.

For a file type variable, when the runner makes that variable available in the environment where the job is running, it will create a temporary file and write the contents of
that variable to that temporary file and store the path to that file's location, as a value and we can reference that file path using the variable name(so in file type variables,
we're the value of variable will be path to the file where the actual content is stored, so we can use this path in SSH command easily!).

If we don't want to hard code the public IP address in ci config, we can reference it as a variable(in this case, let's call it DEV_SERVER_HOST).

It's nice to place all variables in one place.

With `-o` and then use StrictHostKeyChecking=no, we disable the strict host checking and it refers to this highlighted text:
![img.png](../img/section-3/0035_4-21.png)
Whenever we connect to a server for the first time, we get this prompt that says whether we want to confirm the authenticity of the host on our side. But since our
pipeline is running in non-interactive mode, so we're not gonna be entering some values there(like yes, no), we want to disable this check and just say skip that. using `-o`.
![img.png](../img/section-3/0035_4-22.png)

and with this command, we're gonna be SSHing into the dev server.
![img.png](../img/section-3/0035_4-23.png)

### Deploy to dev server:
Once we SSH into the dev server, we want to execute the docker commands. How?

We pass those commands as parameters to ssh command in deploy_to_dev job and we put them in quotes.

Note: The first docker login gets executed inside the gitlab runner and the second one(which is in deploy_to_dev), gets executed on the dev server, because we need to
pull the image from the private repo, so we have to authenticate:
![img.png](../img/section-3/0035_4-24.png)

and since we're executing them as shell commands, we're gonna use && between commands, so we can write next command in script of `deploy_to_dev`.
After we authenticate with the private registry by executing docker login command, we can now pull the image and run it on the server(dev server). So let's run it in the background,
in detached mode(`-d`), we also need to expose the port. We're gonna bind port 3000 on the host to port 3000 in the container. Because our app starts at port 3000(specified in
Dockerfile of app) and the image to run is `$IMAGE_NAME:$IMAGE_TAG`.

--detach or -d = run container in background

![img.png](../img/section-3/0035_4-25.png)

This is how deploy our docker image to dev server. We ssh into dev server, the same way as we did locally, then docker login and docker run.
But our pipeline failed because the key is too open. So we have to limit the permissions to the key just like we did locally, by running chmod.
by adding a before_script in `deploy_to_dev` and use chmod command.
![img.png](../img/section-3/0035_4-26.png)

We were able to pull the specified image from our gitlab repo to that dev server in order to run it as a container.

Now, if we login to dev server using ssh and do `docker ps`, we should see our container running and it is availabe on port 3000.
![img.png](../img/section-3/0035_4-27.png)

### access application from browser:
To access the app, first go to dev server instance and make sure that the security group of the instance, allows access on port 3000. Go to security>security group> edit inbound rules
and add a rule there that will allow access on port 3000 from any source(0.0.0.0./0).
![img.png](../img/section-3/0035_4-28.png)
![img.png](../img/section-3/0035_4-29.png)

Then in instance, either copy the public IP address or the public DNS, let's take the public DNS, paste it in browser and append port 3000
![img.png](../img/section-3/0035_4-30.png)
![img.png](../img/section-3/0035_4-31.png)

So we build and deployed our image successfully on an EC2 server using our gitlab CI/CD pipeline.


## 0036_5_GitLab_Environments_Describe_where_code_is_deployed:
### gitlab environments:
In order to access the app, we had to go to aws UI, we had to get the DNS, endpoint of the app??, we also need to know which port it's running on and ... and then 
we can type it in the browser.

![img.png](../img/section-3/0036_5-1.png)

Now let's say we don't want to search for this info everytime we build the app, instead we want this logic to be inside the pipeline, so that whenever we execute it and the
app gets deployed, we have an overview somewhere where we can just click on a link and it takes us to the deployment endpoint.
![img.png](../img/section-3/0036_5-2.png)

Can we do that in gitlab?

We can. Using a feature from gitlab called environment. Remember gitlab strives to be the devops platform, so they want to integrate and offer all the features that are
part of the CI/CD pipeline or basically the whole application life cycle from the development which is hosting your code in a repo to all the git workflows and ... , 
as well as all the features and tools for building the app using all those types of registries.

![img.png](../img/section-3/0036_5-3.png)
![img.png](../img/section-3/0036_5-4.png)
![img.png](../img/section-3/0036_5-5.png)

But also the final deployment phase and for deployment management in gitlab, we have `Deployments` page and when we deploy our apps, we want to secure them and 
we want to monitor them to make sure everything is running correctly and for these, it has `security & compilance` and `monitoring` pages integrated. 
![img.png](../img/section-3/0036_5-6.png)
![img.png](../img/section-3/0036_5-7.png)
![img.png](../img/section-3/0036_5-8.png)

So gitlab wants to build a platform where we have all these out of the box.

Go to deployments>environments and right now we don't have any envs or any endpoints of deployments for our applications.
![img.png](../img/section-3/0036_5-9.png)

So let's configure our CI/CD pipeline to add a deployment environment.

In deployments>environments, we have an overview of what we deployed to which environment and what is the endpoint of the deployment.

How do we do that?

In deploy_to_dev, we're gonna add an attr called environment and it has a couple of params. One is the `name`, let's call it `development` and for endpoint,
use `url` attr. For example if we have a proper domain configured for the app, this could be for example: dev.myapp.com and for staging, we may have: staging.myapp.com .
But in our case, we use public DNS of the dev server EC2 instance and then append the port. 

![img.png](../img/section-3/0036_5-10.png)

In our case, we can access the app on dev server using either Public IP address(public IPV4 address in pic) or the public (IPV4) DNS name.
So we could reuse the value of DEV_SERVER_HOST as a url as well(for example in url attr), but in practice it's not always the same. So SSHing into a server, may have a 
different endpoint and the application itself will have it's own endpoint.

So these two can be different.

![img.png](../img/section-3/0036_5-11.png)

So in this case, let's differentiate them and let's use the public DNS as the url and not to hard code it, we can create a variable named DEV_ENDPOINT.

When this pipeline runes, gitlab will see that we have environment attr defined and it will see that there is no env with this name, so it will create one on the
first run and on the succesive runes, it will know which env we're deploying to.
![img.png](../img/section-3/0036_5-12.png)

Now gitlab will know that this deployment applies to the env called development.

The commit of ci config, will trigger the pipeline and in order for the deploy to work, let's stop the running docker container, otherwise this build will fail.
So on the shell connected to EC2 dev server, run: `docker stop <container id>`, otherwise it will complain that port 3000 is already in use.

Now pipeline is passed, deployment was successful. Now go to deployments> envs and now we have a new env which is called development.
![img.png](../img/section-3/0036_5-13.png)
![img.png](../img/section-3/0036_5-14.png)

This gives you a good overview of what commit or which state of your code, is deployed to which environment? and the `open` link there will take you **directly** to that url,
so you don't have to type in the public dns or ... of app.
![img.png](../img/section-3/0036_5-15.png)

When you have multiple envs for multiple apps, this can be helpful for knowing exactly which commit is deployed where, what is the state of the deployment and when
it deployed last time. You can also see which team member(which would be a gitlab user) triggered that deployment.
![img.png](../img/section-3/0036_5-16.png)
## 0037_6_Deploy_with_Docker_Compose:
### CD with docker-compose:
### Why using docker-compose
Currently, our deployment is primitive. We're just running docker run command and starting one container and that's it and now if we change the version of image by changing
the IMAGE_TAG variable and build a new version and deploy that using the pipeline, the pipeline would fail(the deploy_to_dev failed) because we already have a container running
on port 3000 on the host, so a new one cannot be run. So docker run command only works the first time when no container is running yet and after that it will fail.
![img.png](../img/section-3/0037_6-1.png)

That's one problem that we have, another issue is if we wanted to deploy some other containers for our app. For example if we needed a database for our nodejs app,
or maybe we have an authentication service and some other additional stuff that our app needs, all which should run as docker containers.

**So how do we run multiple docker containers in the build without repeating this `docker run ...` command?** and for this type of cases, we have docker compose.

Docker compose lets us define a configuration of all the containers that we want to run, as a list and for each container we can configure the ports that we want to open(using
`ports` attr), maybe we want to set some environment variables(using `environment` attr) for those containers and we can define all of that in a docker-comppose.yaml file in a yaml
format just like our pipeline config and we can just start everything defined in the docker compose using `1` docker compose command(and not **multiple** `docker run ...` commands).
![img.png](../img/section-3/0037_6-2.png)
![img.png](../img/section-3/0037_6-3.png)

Let's create a docker-compose.yaml file where we configure how our application's container should be run and deploy it using docker compose command.
![img.png](../img/section-3/0037_6-4.png)

### write docker-compose file:
We're gonna make a change in pipeline script as well as create a new docker-compose file. If you want to develop on gitlab UI itself, since we're gonna change
multiple files and then commit all of them, we need to use the gitlab web IDE and we can't just change one file by clicking on it to edit(because we want to edit
multiple files and commit all of them at once and by editing one file, we have to commit it before going to the next file).

Gitlab web integrated development environment (web IDE)

Create docker-compose.yaml .

A list of `services` which are our images(our applications) that we want to deploy, we can give each service a name that we want. Let's call the first one **app** and you can
get the image you want to deploy from private container registry and choose one of the tags that has a version(look at 0037_6-6).

To each service, we can add some env variables, volumes and ..., 

![img.png](../img/section-3/0037_6-5.png)
![img.png](../img/section-3/0037_6-6.png)
![img.png](../img/section-3/0037_6-7.png)

Now that we have docker-compose available in our project, lets use it to start the container instead of docker run command in `deploy_to_dev` job.

### use docker-compose in our pipeline:
Note: docker-compose up = start up the application stack

docker-compose up will start any container or services defined in the docker-compose.yaml file.

![img.png](../img/section-3/0037_6-8.png)

Currently, if we run this pipeline multiple times, again we would have containers that are already running that we would need to stop first and we can do this
by using the `down` command of docker-compose. The down command will go through docker-compose, it will find all the services defined(till here, it's just like `up` command) and
it will stop all the containers that are running and that are defined in docker-compose.

### install docker-compose and copy file:
There are 2 things we need to do in order for this to work.

Currently, we're executing `docker-compose` file on that dev server, so just like we installed docker and made it available there so that we can execute docker commands,
we need to also install docker-compose on our dev server, to be able to run docker-compose files.

![img.png](../img/section-3/0037_6-9.png)

**Note:** In `deploy_to_dev` job, the ssh command will execute on gitlab runner and the docker login and docker-compose commands(the commands after that ssh),
will run inside the dev server and not on gitlab runner:
![img.png](../img/section-3/0037_6-10.png)

In order to do this, first ssh to dev server and to get the command for installation of docker-compose, write: docker-compose and copy the related command:
`sudo apt install docker-compose`.

Now run `docker-compose` to confirm it's installed.

Currently, the whole source code is available for gitlab-runner but it's not available for dev server. So what we want to do, is we want to
copy that docker-compose.yaml file from the gitlab runner to the dev server BEFORE we execute docker-compose on dev server.

So either in the `before_script` or inside the `script` of `deploy_to_dev`. Let's add a new array item before everything else in `script` attr.

Use scp command and disable host strict key checking and use private key by using $SSH_PRIVATE_KEY and provide the source of the file(`./docker-compose.yaml`) and the 
destination(`ubuntu@$DEV_SERVER_HOST:/home/ubuntu`)

Note: The default location where the ssh command will be executed on, is `/home/ubuntu` and we want to copy that docker-compose command there.

### run pipeline:
After changes in web IDE, we want to commit the changes. For this we have an option to create a new branch and then start a new MR or we can commit directly to main branch!
**In a typical developer workflow, you'll be working with MRs, so even if you don't create feature branches, you would still create a MR and not commit it directly to
main branch.**
 
![img.png](../img/section-3/0037_6-11.png)

After triggering the pipleine by commit changes directly to main branch, you will face this view:
![img.png](../img/section-3/0037_6-12.png)

After some time, the deploy stage has error:
![img.png](../img/section-3/0037_6-13.png)
It's because we didn't stop the running docker container before(docker compose couldn't stop that container because it was't defined inside the
docker-compose file, so it cannot reference it using the container ID for example or container name. **Because it was not created using docker-compose, that's why we have to
stop it manually**). For this run `docker ps` and then grab the id and run: `docker stop <container id>`.
![img.png](../img/section-3/0037_6-14.png)

Now rerun the pipeline manually by going to CI/CD>pipelines page and click on Run pipeline button:
![img.png](../img/section-3/0037_6-15.png)
and then select run pipeline for which branch or tag: 

![img.png](../img/section-3/0037_6-16.png)

Now if you do docker ps, our container is running using the service name that we defined in docker-compose.yaml:
![img.png](../img/section-3/0037_6-17.png)

Plus when docker-compose starts containers, it adds the current folder's name(which in pic, the folder name is `ubuntu`) as a **prefix** to the container name.
You can get the current folder's name by running simple `pwd`.
![img.png](../img/section-3/0037_6-18.png)

In pic above, in NAMES section, `ubuntu_app` is service name and `1` is container name(`ubuntu_app_1`).

Our app is running and accessible and in environments page of gitlab, we can see it.
![img.png](../img/section-3/0037_6-19.png)

Our app(look at url):
![img.png](../img/section-3/0037_6-20.png)

Now you can put any other containers in list of services in docker-compose file, like DB service, messaging service and ... and you wouldn't have to change
anything in your CI/CD pipeline code.

### optimize the pipeline:

![img.png](../img/section-3/0037_6-21.png)
As you can see the default for docker-compose file is docker-compose.yml . This means, if we're using docker-compose.yml , then, we can leave out this option.
The insructor thinks it works with yaml extension as well. So remove that option(-f) and it's argument.

Currently we have the image name and image tag hard coded in our docker compose file, however, when we're building new images, obviously the version of the image
will be updated, so we don't want that to be hard coded in the docker-compose file, instead we want that to be dynamically set with the pipeline logic.
So let's parameterize it using $IMAGE_NAME and $IMAGE_TAG and note the syntax here is `${}` and not only `$`, that's how we reference env variables in docker-compose.

Now we need to set those variables. How?

**Important:** Before we run the `docker-compose up` command on the dev server, we want to export those variables and we want our pipeline to export those environment variables.
Add these in script attr of `deploy_to_dev` job.

So we used ci config variables to set them as env variables on that dev server using `export`.

The export $IMAGE_NAME inside ci config is an env variable inside gitlab runner which we created using variables attr of gitlab ci config and IMAGE_NAME is the env
variable that we're setting on the dev server which are referenced on the docker-compose file. So let's prefix docker compose variables with `DC_`.
![img.png](../img/section-3/0037_6-22.png)

By running pipeline, it will build and deploy a new image to the dev server. To confirm everything was successful, go to environments page and open the last deployment.

So now we have a docker compose that doesn't have a hard-coded image name and image tag inside it.

With this, we have now a basic structure of a real pipeline that runs unit tests, builds an image, pushes that image to a docker registry and then deploys it using
docker-compose on a development server and we have everything parameterized and not repeating code or hard coding values throughout our pipeline logic.
![img.png](../img/section-3/0037_6-23.png)