
## 0005_1_Chapter_Introduction:
How build a CI/CD pipeline using gitlab CI/CD to continuously deliver application changes?

Let's say we want to create a basic workflow where each time code changes get pushed to the repo, we test those changes and if tests are
successful, we build the application into a docker image and then we push the docker image into a docker registry. How can we do that in gitlab CI/CD?
![img.png](../img/section-2/0005_1-1.png)

### scripted pipeline:
The whole logic of the pipeline is scripted in yaml format.

As part of the infrastructure as code concept, the whole logic of the pipeline is scripted in yaml format. So we have a .gitlab-ci.yml that includes
the whole CI/CD pipeline config(the complete logic of the workflow).

![img.png](../img/section-2/0005_1-2.png)

## 0006_2_Jobs_Basic_Building_Blocks_of_Pipeline

### jobs
Job is basically a step in the pipeline(workflow) that does sth.
![img.png](../img/section-2/0006_2-1.png)

script attr lets you define commands(any command that you can execute on your OS) that you want to execute in that job(step) of the pipeline.
![img.png](../img/section-2/0006_2-2.png)

![img.png](../img/section-2/0006_2-3.png)

---

Let's say in the run_test job, we want to **prepare** the environment before we run that job. So before the commands defined in the script section of job,
we want to do some preparation work. For example, we want to set some env variables, we want to generate some test data, we want to connect to some service and
fetch the test data, ... . So basically we want to do some work before script section gets executed and for this we have `before_script` inside the jobs.
![img.png](../img/section-2/0006_2-4.png)

Now let's say once the tests are completed, we want to clean up some stuff. Maybe we want to remove those test data. So we want to do some data after
the script section commands ran and for that, we can use: `after_script`.
![img.png](../img/section-2/0006_2-5.png)

Now let's see how to **execute** this pipeline?

## 0007_3_Execute_Pipeline:

### execute CI pipeline:
**Note:** This pipeline needs to be defined for a specific project or a git repo.
![img.png](../img/section-2/0007_3-1.png)
![img.png](../img/section-2/0007_3-2.png)

Note: The pipeline logic of the app becomes part of the app code itself. So we're not only hosting code or the logic of the app, in the same repo,
we're also including code that defines how this app should be built with .gitlab-ci.yml which is part of the infrastructre as code trend where we
keep everything as code whether it's the app logic or config logic or build logic.

![img.png](../img/section-2/0007_3-3.png)

### pipeline execution:
by including the .gitlab-ci.yml (even for the first time), gitlab detects it and execute it's logic. To see what happened, go to CI/CD.
![img.png](../img/section-2/0007_3-4.png)

On every code push(including app logic or pipeline logic code), gitlab will automatically re-execute the pipeline.
![img.png](../img/section-2/0007_3-5.png)

## 0008_4_Stages_Group_jobs:
### stages:
Currently, all the jobs are executed in one stage which by default is called `test` and they're all running in parallel, but we don't want this.
Because when we run the pipeline, we want to run some jobs in a certain order, basically we want some stages that pipeline goes through.

In our simple pipeline, we want to push the image only after we built the image and run the tests after pushing the image. So these jobs shouldn't run in
parallel, they should run in order.

Also in addition to run jobs in sequence, another important task of stage is that if one of the jobs fails, then the next job should not run. But if some jobs
execute in same stage fail, if some job fail, still others(if were successful), will run.

![img.png](../img/section-2/0008_4-1.png)

![img.png](../img/section-2/0008_4-2.png)

![img.png](../img/section-2/0008_4-3.png)

For these use cases, we have a concept in gitlab CI/CD which is called stages.

Also, with stages we can logically group multiple jobs that belong together. For example in test stage, we can run unit tests and functional tests and ... .

To create stages, use an attr called stages at the top of the ci config file.

Then we want to group the jobs under those stages that we defined. So we want each job to belong to a certain stage.

We have two jobs that both run tests(one unit and one lint tests) and we don't care if they run in parallel, so we want to group them under one stage.
So add a stage attr on the beginning lines of config for a job, named `stage` for the jobs that should run in the same stage.
So now we have two tests jobs that belong to the test stage.

Note: Tests can run in parallel, independent from another.

**Note:** So now we have jobs grouped under some stages and if one of the jobs in one stage fails, it will fail that stage and the next stages will be **skipped**, because
it doesn't make sense to execute the next stages after that failure. For example if one of the tests failed, then the next stages like build and deploy would be skipped.

## 0009_5_needs_Dependency_between_jobs
### "needs" - relationships between jobs:
There is one more issue that we currently have which is even though we're skipping the next stages when a job fails, the other jobs in the same stage of that failed
job still get executed. That's because they're in the same stage and therefore they run in parallel. However, in some cases, we want to run job2 that is in the same
stage of job 1, if job 1 was successfully executed. So we want to execute jobs in the same stage(within the same stage, not across stages) in the certain order.
So we don't want to execute those jobs in parallel, instead in sequence, so that if job1 failed, job2(within the same stage) and other jobs after that should be skipped.
![img.png](../img/section-2/0009_5-1.png)
![img.png](../img/section-2/0009_5-2.png)
Yeah, we could configure the jobs that should run in sequence in addition stages so that if job1 in it's defined stage failed, the next stage that contains job2 won't run,
but actually we don't want to configure a new separate stage for job2. Instead, we need to configure a job dependency. For this, in job2 that should run if job1 was
successful(both are in the same stage and we don't want job2 to run in parallel), specify a needs attr(which means it depends on the things we list for this attr).

With needs attr, it tells gitlab that even though these jobs are in the same stage, this job with needs attr and has job1 as one of the entries for `needs`, depends
on the job1. So it will be skipped if job1 failed.

`needs` gets a list, so you can depend on multiple jobs **within the same stage**.

![img.png](../img/section-2/0009_5-3.png)
![img.png](../img/section-2/0009_5-4.png)

### visualizations:

## 0010_6_script_Inline_shell_commands_and_executing_shell_script
### **_script_** - commands to execute:
Now we have the structure of our pipeline with stages and jobs. Let's run some real commands in jobs.

### inline commands:
In script, we can run OS commands. So if those jobs run on linux server, then you would write linux commands.

Gitlab.com executes all the jobs on a linux env, that's why we can use linux commands.

![img.png](../img/section-2/0010_6-1.png)

### execute script file:
Instead of having the whole script commands defined inside the pipeline config file which will make our pipeline code less readable and we will
lose the overview of all the jobs defined there, we can extract the script section commands to a bash script file like `prepare-tests.sh` and remove the
dashes from the beginning of the files because we're no longer in a yaml file.

Then reference the script file in ci file as an array entry for `script`. However, before we can execute that shell file, we want to make that shell script
executable, so we need to run this command before referencing that sh file in ci(we need to get execute(`x`) permission on that file):
```shell
chmod +x <name of the shell file>
```

![img.png](../img/section-2/0010_6-2.png)

### note on pipeline execution:
In gitlab CI/CD, everytime we execute a pipeline, it executes it on a fresh new environment. So we won't even have to cleanup the
folders or other stuff that we created. So we don't need to worry about that we'll execute for example a mkdir command multiple times and it will fail,
because gitlab will cleanup the env and you won't get an error like `directory already exists...`. So we will always get the same result, when our pipeline
runs.

## 0011_7_only_Specify_when_job_should_run
### `only` - specify when job should run:
Currently, everytime we commit the changes to the main branch, it automatically executes the pipeline.

Now what happens when we create a feature branch and start working on it? Will the pipeline get triggered?

When we immediately create a new feature branch, pipeline will get triggered for that feature branch for the last commit(which was pushed to the gitlab) to that branch
and this means that .gitlab-ci.yaml applies to every branch and executes pipeline whenever code gets committed(pushed to remote) to **any branch** in the repo.
![img.png](../img/section-2/0011_7-1.png)

That's not entirely what we want. Because when we're working in a feature branch, we don't want to build the docker image and deploy that to the development environment.
**So basically we don't want to release any changes directly from a feature branch. We only want to make deployments from the main branch.** However for feature branches,
we **do want** to run the test to see whether we broke sth in the app, with our changes. So basically validate our code using those tests before we merge
that feature branch into the main branch and we only want to build and deploy, when we're done with the feature implementation and merge it back to main.

![img.png](../img/section-2/0011_7-2.png)

**Q:** How can we tell gitlab that our pipeline logic should only run for main branch and for feature branches, only those two jobs that are in test stage, should be executed.
In other words, how can we differentiate logic of the pipeline execution for different branches?

In ci config file, for jobs that should run when we push to main branch(all the other branches should ignore those jobs when we push code to them), add:
```yaml
build_image:
  only:
    - main
```
So as values of only, we list out the branches that the jobs containing this `only`, should be executed for.
In this example, we're saying only execute build_image job, for main branch(when we pushed code to main branch and so when we push code to other branches, this
job shouldn't run).

**Note:** We're gonna leave the test related jobs, unchanged, because they should run for all the branches.

Now if we create a new branch and push it to gitlab, if you go to pipelines page, you should see the pipeline is running for our feature branch, however,
only the test stage is executing and build and deploy stages and their jobs won't get executed.


## 0012_8_Workflow_Rules_Control_Pipeline_behavior:

### workflow rules:
**Let's say we don't want to execute this pipeline for any branches other than the main branch**. So we want to **completely(don't execute any jobs)** ignore it,
when it's not the main branch. But how?

One option is to copy and paste:
```yaml
only:
  - main
```
in every job(we can place it before the stage attr).

![img.png](../img/section-2/0012_8-1.png)

Or, if we don't want to repeat this same config for every single job(because we want to control the **whole** pipeline) and we want to define it on a global
level for the whole pipeline, we have a dedicated config for that, which is called `workflow:rules`.

Instead of defining that `only: -main` for every job, at the beginning of the pipeline add a rule in workflow:rules and there we say:
If it's the main branch, execute the whole thing(pipeline), if it's not the main branch, then skip the whole pipeline.

![img.png](../img/section-2/0012_8-2.png)

```yaml
- if: <condition>
  when: never
- when: always
```
never execute this, if <condition>. In all other conditions, always execute it.

How can we check that the branch that is currently being built, is main branch or not? So how do we get to know inside our pipeline logic,
which branch we're currently building?

We have that in an env variable.
![img.png](../img/section-2/0012_8-3.png)

So this:
```yaml
workflow:
  rules:
    - if: $CI_COMMIT_BRANCH != "main"
      when: never
    - when: always
```
is equivalant to defining:
```yaml
only:
  - main
```
in all of the jobs of that pipeline.

## 0013_9_Trigger_Pipeline_on_Merge_Request:
Currently, our pipeline will only run when we commit to the main branch and all the other branches will be ignored. But we do want to run tests(test stage) for
one more specific branch and that is the merge request branch. Which makes sense, because once a developer is done with feature branch and creates some
merge request, we want to make sure that that merge request is in state to be merged, so there are no breaking changes, the tests are not failing and ... and
we can validate that by running **only** the test stage of the pipeline.

![img.png](../img/section-2/0013_9-1.png)

### what is a merge request(pull request on github)?
When a developer is done implementing a feature in their feature branch, they will create a request to merge whatever was done in this feature branch(the code changes)
into the main branch. Instead of directly merging the feature branch into the main branch(main can be any branch here).
So it's like an intermediate step to add the code changes that was done into the main branch.

Now why do we need this intermediate step, why can't we just merge the feature branch into the main directly?

Because when we create a merge request that request can be reviewed by another developer(maybe someone with more exprience and they may identify some
issues or ...).

![img.png](../img/section-2/0013_9-2.png)

So an MR is a great way to collaborate and make sure that only quality code ends up in the main branch and because of it, it makes sense to
run the tests on this **merge request branch**, before we merge it to the main.
![img.png](../img/section-2/0013_9-3.png)
We can ignore the feature branches(by saying: $CI_COMMIT_BRANCH != "main" and then use: `when: never` for that if)
and do not run any pipeline for them because we can assume they are in progress, so the code is not really finalized, but once
it's finalized and the dev creates a MR, then we want to run tests on that merge request branch and once that's merged to the main, or once
that request gets approved, then the **whole** pipeline will run for the main branch.

This will evaluate whether a merge request event triggered the pipeline:
$CI_PIPELINE_SOURCe != "merge_request_event"

In:
`- if: $CI_COMMIT_BRANCH != "main" && $CI_PIPELINE_SOURCe != "merge_request_event"`
we're saying: if the branch that we're currently building is not `main` and the pipeline trigger is not a merge request, then do not execute the pipeline at all.
So if this if statement is true, it means that branch was either a feature branch or bug fix branch, whatever.

For a MR, we only want to execute the tests, so other jobs like build_image, push_image and deploy_image should still be executed only for the main branch.
So add:
```yaml
only: 
  - main
```
to those three jobs.

So now if we're on a feature branch and we push the code to repo, the pipeline should not get executed at all.

Now if we were done with that feature and we want to merge it(the merge event gonna trigger) back to the main branch($CI_COMMIT_BRANCH would be "main"),
as soon as we create a merge request to main branch, the pipeline should be triggered and only the test jobs would run not the docker image related jobs.
So only one stage which is the test stage should run for a merge request to the main branch(two conditions should be satisfied).

I guess if we want to merge a feature branch into for example staging(yeah the merge event would trigger and one of the conditions of running the pipeline
would get satisfied), but the CI_COMMIT_BRANCH is not main, so pipeline would trigger in this case.


### configure pipeline:


## 0014_10_Predefined_CI_CD_Variables_in_GitLab:
### predifined environment variables:


## 0015_11_Define_Custom_Variables
### define project CI/CD variables(in gitlab GUI):
![img.png](../img/section-2/0015_11-1.png)
Let's say you want to run pipeline for multiple microservices and you want to pass the microservice name as a parameter to your pipeline.
![img.png](../img/section-2/0015_11-2.png)
![img.png](../img/section-2/0015_11-3.png)

Or let's say you have 2 test deployment environments and you want to define as a parameter, when you execute the pipeline, **which deployment env**, this microservice
should be deployed to.
![img.png](../img/section-2/0015_11-4.png)

How can we define our own variables for pipeline?

![img.png](../img/section-2/0015_11-5.png)

In gitlab, go to settings>CI/CD>variables. Let's create a variable named `MICRO_SERVICE_NAME` with value of `shopping-cart` and **uncheck** the
`protected variable`.

Add another one named `DEPLOYMENT_ENVIRONMENT` and value: test-2.myapp.com .

Now these variables will be available in the project's CI/CD pipeline. For example you can say: `$MICRO_SERVICE_NAME` in the pipeline.

### File variables(in gitlab GUI):
Often we need some external configuration or some kind of properties file? when building app or running tests for our app. This could be a properties file that
has configuration about DB service, the address of the DB, the DB name, all the service endpoints that app needs to connect to ... and we can
provide this type of external file configuration also using the variables in gitlab.

For this, when creating a variable, set it's type to `file` and uncheck the protected variable checkbox and the value of variable will be the file contents and
the value can be in format of yaml, json, key-value pairs and ... . Let's name the variable `$PROPERTIES_FILE`.

For getting the path of the file that that file variable references, just use the variable name, but for getting the file contents, run:
`cat <name of the file variable>`

![img.png](../img/section-2/0015_11-6.png)
![img.png](../img/section-2/0015_11-7.png)

### define variables in .gitlab-cy.yaml file:
The simplest use case of why we need variables generally is this case.
![img.png](../img/section-2/0015_11-8.png)

Let's say in the build_image job, we're using name of the docker image that we're creating.

Note: When we want to push docker images to a docker registry, we have to tag those docker images with the registry name. So docker knows to which
registry we want to push those images. So the location of the docker registry is implicitly in the image name.

Let's say in our pipeline, we're pushing the docker images to dockerhub private registry, so we want to tag the images accordingly and the dockerhub registry server name is:
docker.io , so tag the image like: `docker.io/<docker id>/<image name>:<tag>` (look at the build_image job).

`docker.io/<docker id>/<image name>:<tag>` is the full tag of our image that we're building in the pipeline.

After building, we need to again reference this long name in other jobs(push_image, deploy_image).

So we're repeating the same value in our pipeline multiple times. Now if we want to change it, we need to change it in all the places. So this is another
use case of variables, which is the simplest usage of variables.

So we don't want to repeat values, therefore, we use variables.

We can create variables for each specific job, by saying:
```yaml
variablrs:
  image_repository: docker.io/<docker id>/<image name>:<tag>
```
inside the configurations for a job.

Now if you need a variable in multiple jobs, we want to define it globally for all the pipeline. So define it on a global level.

Now instead of hard-coding the same value multiple times in our pipeline logic, we use variables.

In this case, we can use upper case variables or lower case variable names.
![img.png](../img/section-2/0015_11-9.png)

## 0016_1_GitLab_Runners_for_running_the_jobs
### gitlab architecture:
We configured the logic to decide commit to which branches specifically, should trigger this pipeline.

Now the question is: Where does gitlab execute these tasks? Like we executed those echo commands in the jobs as well as some linux commands.
Where does all this happen? It has to be executed on some environment, some server and obviously in our case, it's a linux server because
we executed linux commands. But where are they hosted?

![img.png](../img/section-2/0016_1-1.png)
![img.png](../img/section-2/0016_1-2.png)

### Gitlab server and runner:
Let's see how gitlab architecture works and how the jobs and pipeline get executed?
First of all, we have a gitlab server which is also called a gitlab instance or gitlab installation.
- It is the main component of this whole gitlab architecture
- and has all the information about your pipeline configuration.
- It manages the execution of the pipeline and it's jobs
- and stores the results

![img.png](../img/section-2/0016_1-3.png)

So the gitlab server knows what needs to be done, but doesn't do the job itself.
The jobs are executed on what's called `gitlab runners` and you can have multiple runners connected yo your gitlab instance to distribute this load.
So gitlab server says: These jobs need to be executed and it picks one the available gitlab runners or agents that execute those jobs.
![img.png](../img/section-2/0016_1-4.png)

Who manages the gitlab architecture?
With gitlab, we have 2 ways of using it:
Gitlab itself offers a managed gitlab instance which is gitlab.com that you can use to **build** your projects, just like you can **host** git projects
on gitlab.com . So that's the Saas platform that gitlab offers and it's managed for you by gitlab engineers. You don't have to set it up or do any kind of
config. So this Saas platform is the gitlab instance.

Now what about the runners that execute the jobs in our pipeline? Who created or who is managing these runners?

Gitlab with this managed solution, offers you runners that they managed for you.
![img.png](../img/section-2/0016_1-5.png)
### What is a runner?
Gitlab runner is a small program that you install on a separate machine(so not the machine where gitlab server is running, but on a separate(physical or virtual
machine)) and it's connected to the gitlab server and once that connection is established, gitlab runner can execute the jobs that gitlab server sends it and
gitlab offers a list of runners that they manage and make available for all gitlab users and their projects and these are called shared runners. A shared runner is a
runner that can be used or shared for all the projects in the gitlab instance on gitlab.com .
![img.png](../img/section-2/0016_1-6.png)

## 0017_2_GitLab_Executors_Different_Executor_Types
### executors:
Gitlab runner is a small program that we install on a server to make it possible to run gitlab pipeline jobs there. But the gitlab runner program isn't the
one that will actually execute the jobs.

![img.png](../img/section-2/0017_2-1.png)
![img.png](../img/section-2/0017_2-2.png)


### shell executor:
In last pic, we can see all the **commands** that can be executed **on an OS directly**. So the commands in jobs will be executing on some OS, on the shell of
the server where we installed the gitlab runner and this is actually how jobs are executed on jenkins.

So the gitlab runner program is actually a mediator. It will fetch the job from the gitlab server and hand over the commands of the job to the shell of the server
that it's running on and this is the simplest and common way of executing jobs on a gitlab runner server and the environment where the jobs are executed,
is also called a shell executor. Because as we mentioned, it will be executed in the shell program of the OS where the gitlab runner is installed.
![img.png](../img/section-2/0017_2-3.png)
![img.png](../img/section-2/0017_2-4.png)

Now let's say we want to execute all the commands in the above diagram on one single runner, which again is one server with gitlab runner installed on it, that
hands over the commands to the shell executor.

![img.png](../img/section-2/0017_2-5.png)

So we have npm commands, docker command and ssh. Or if we were building a java app, we would need java, maven or gradle and ... in order to build
and package the app. This means we would have to install these tools on the server where the gitlab runner is installed, in order to make these commands
available there. Because logically if we want to run `docker build ...` command, we have to have docker cli installed on the OS and same for java, npm and ... .
![img.png](../img/section-2/0017_2-6.png)

So we need to install and configure these tools and update their versions and basically **manage** these tools on that gitlab runner server. Which means a lot of
manual work for the administrators of that gitlab runner server. Plus when we migrate the runner, meaning we have a new server and we want to execute all our
jobs there, so basically we install gitlab runner on another server and want to move all the execution over there, we would need to install all these tools
on the new runner.
![img.png](../img/section-2/0017_2-7.png)
![img.png](../img/section-2/0017_2-8.png)

In addition to that, let's say, there is one runner that is shared among multiple git projects. Let's say we have multiple microservices and all the jobs of
these microservices are executed on this one runner and one project's job needs npm version 6 while another project's job need npm v7, which means
another complexity for the administrators because now we have to manage these deps when you need different versions of the same tool for different jobs.
![img.png](../img/section-2/0017_2-9.png)
And finally, when you execute multiple jobs on the same runner, you actually have leftovers on the server from previous job execution. So the environment gets cluttered
and you have a lot of temporary files or things that remain from each job execution.
![img.png](../img/section-2/0017_2-10.png)

So executing jobs on runner's operating system directly has all these limitations.
![img.png](../img/section-2/0017_2-11.png)

Now the question is Do we have som alternatives? Or better options?
Yes, in fact gitlab supports multiple execution environments or executors, in addition to the shell executor.

### docker executor:
The shell executor is the most basic and simple one, but it has limitations
![img.png](../img/section-2/0017_2-12.png)
![img.png](../img/section-2/0017_2-13.png)

and a better alternative to that, is docker executor. So this is basically executing the jobs, NOT directly on the shell of the OS, but inside a
docker container. So on the server of the runner, a fresh new docker container is created to run the job. So for each job, completely new fresh docker
container is created, once the job is done, container gets removed and this solves a couple of things:
1) You can use images with already installed npm, java or... you need. So you don't have to manually configure anything on the server, except for the docker itself. Plus,
   now you can choose a different version for each job as you need. So basically you execute 1 job in a docker container which has npm v6 and you execute another
   job in another docker container with npm7. We have no conflict of versions at all.
2) Each job will be executed in a fresh new container, so no leftovers of the previous job and you have a clean state for each job.
   ![img.png](../img/section-2/0017_2-14.png)
   ![img.png](../img/section-2/0017_2-15.png)
   ![img.png](../img/section-2/0017_2-16.png)
   ![img.png](../img/section-2/0017_2-17.png)
   ![img.png](../img/section-2/0017_2-18.png)

### virtual machine executor:
Let's say your company doesn't know docker, so you don't use docker at all, but instead you use virtual machines. In this case, you can
use virtual machine executor on the runner to still have the isolated environment for running the jobs. However note that this will take longer
because for every job, a new virtual machine needs to be created and loaded which means loading the whole OS, so obviously the whole pipeline execution will
take longer. So while you still have the advantages of having isolated environment for each job and easy to manage dependency versions and ... , it slows down your
pipeline execution.
![img.png](../img/section-2/0017_2-19.png)

### k8s executor:
We have a k8s executor type, which means if you have an existing k8s cluster, which is properly configured, with scalability, using auto-scaling and ... and
you want to utilize that, plus maybe you want to use some cluster internal resources in your jobs, you can use the k8s executor an with this executor,
a new k8s pod will be created as an environment to run the job.
![img.png](../img/section-2/0017_2-20.png)

### docker machine exector:
Docker machine is a tool for scaling and managing docker environments. It was created by docker itself. It lets you create docker hosts on your computer,
on cloud providers, and inside your own data center. It creates servers, installs docker on them and then configures a docker client to talk to them.

So it's like an abstraction or managing layer of docker itself, so you can manage multiple instances of docker on a machine and docker machine executor works
pretty much the same way as docker executor.
![img.png](../img/section-2/0017_2-21.png)
![img.png](../img/section-2/0017_2-22.png)

Note: This is an executor type on gitlab's shared runners(runners that gitlab manages for you) and those runners are using docker machine executor. However,
know that docker machine has been deprecated by docker, so gitlab will most probably replace it with another executor type on it's shared runners.

Now there are 2 other executor types which are ssh and parallels executor. They are not interesting for us.
![img.png](../img/section-2/0017_2-23.png)

### which one to choose?
Which executor type should you choose?
For most cases, for building a standard CI/CD pipeline docker executor on linux runners is the best option.
![img.png](../img/section-2/0017_2-24.png)

However, you may have some specific use cases.
For example, if you need an operating system specific environment, then you can use the shell executor and execute jobs on windows and linux on the OS level.
![img.png](../img/section-2/0017_2-25.png)
You might also have a case where you want to have everything in k8s, because you're managing the whole infrastructure using k8s cluster and you want to take advantage of
that and also execute your pipeline jobs within k8s cluster.
![img.png](../img/section-2/0017_2-26.png)

### configure executor for runner:
How do you define and configure which executor a runner uses?
When you register a runner(we will see how to do this in future), you have to define an executor.

For example let's say we chose the docker executor.

So you as administrator, when you're creating and configuring this runner, you have to say: "I want this runner to execute jobs using a docker executor or shell executor or ..."
and you can define only 1 executor per runner.

When you register a runner(we will see how to do this), you have to define an executor.
![img.png](../img/section-2/0017_2-27.png)

Now what if you need multiple executors on the same host? or the same server? Like you have an EC2 instance as your gitlab runner and you want to execute jobs
in shell executor but also docker executor, because you have several jobs and some of them are best executed in shell executor and some of them are best
executed inside docker containers. So how can you use the same server(physical or virtual host) to do that?

For that, you can register multiple runners on the same host. So you can have 1 machine with for example 10 runners registered on it, each one with it's own executor.
![img.png](../img/section-2/0017_2-28.png)
![img.png](../img/section-2/0017_2-29.png)

## 0018_3_Job_Execution_Flow
### architecture recap & execution flow:
In gitlab architecture, we have the gitlab server(gitlab instance), the gitlab runner and the executor.
![img.png](../img/section-2/0018_3-1.png)
![img.png](../img/section-2/0018_3-2.png)
The execution flow will look like this:
1) the gitlab runner will pull new jobs from gitlab instance, For example a managed gitlab instance from gitlab.com .
2) once it has this job, the gitlab runner will compile the information and send the jobs payload to the executor.
3) the executor will download the source code of the app directly from gitlab instance and will execute the job
4) once the executor is done executing the job, it will return the output of the job to the gitlab runner
5) then gitlab runner will notify what the executor provided, back to the gitlab instance

and in this course, we will see the usage of shell and docker executors and see this whole workflow in action.
![img.png](../img/section-2/0018_3-3.png)

## 0019_4_Docker_Executor
### gitlab's shared runner:
Q: Which runner and which executor was used to execute our pipeline jobs? and how we can see that?
Gitlab CI/CD by default offers the shared runners and when you execute a pipeline, one of the available shared runners is selected for each of the
pipeline jobs.
![img.png](../img/section-2/0019_4-1.png)

one of the available shared runners is selected:
![img.png](../img/section-2/0019_4-2.png)

These runners are managed by gitlab itself and they are called shared runners and they're using docker machine executor and it will be replaced in future,
because docker machine got deprecated.


![img.png](../img/section-2/0019_4-3.png)

To see which shared runners execute our jobs, go to job execution logs. So if you click on one of the jobs and look at the beginning of the logs.
For example:
1) `Running with gitlab-runner <name of the runner> on ...`(name of the runner is written here)

2) Then we would have sth like:
   `Preparing the "docker+machine" executor` (the executor type)
   and by having docker machine as the executor, it means just like with docker executor, the job will run inside a docker container.

3) Then it will show the information about which docker image was used to build that container and execute the job. In logs for this, we would have sth like:
   `Using docker executor with image <sth like ruby:2.5>`.
   Yeah it said `docker executor`, but we're using docker **machine** executor.

4) Then it would pull that image on that runner and says:
   `Pulling docker image ruby:2.5`

5) Then it would preprare the environment for the job execution:
   `Preparing environment`

6) and once the container is ready, the application source code is downloaded from the git repo, inside the container
   `Getting source from Git repository`

7) then all the commands inside the job definition get executed.

8) After the job commands get executed, the environment gets cleaned up
9) the docker container that executed that job which we're currently in, is being destroyed

Note: Each job may get executed on a completely different runner. So just because they belong to the same pipeline, doesn't mean that
all the jobs in the pipleine get executed on the same machine or the same runner and there is a important concept, we're gonna study it in future.
So if you click on other job logs of pipeline, you may see some different log at the beginning of the logs which is related to the information of the used runner.

So CI/CD jobs can get executed on different runners and machines.

![img.png](../img/section-2/0019_4-4.png)


and with docker machine or docker executor, every job will run in a fresh new container which isolates each job execution and even allows you to use
some sensitive secret data in your job environment without sharing it across jobs or projects.
![img.png](../img/section-2/0019_4-5.png)

---

Let's see where are those shared runners that gitlab manages and makes available for us, displayed?
Go to settings / CI/CD then look at the `runners` section and you will see a list of shared runners there by expanding the section.

Since gitlab.com platform is one gitlab instance, all the projects on gitlab.com can use those shared runners and that's why they're called `shared`.

In practice, we don't really care which shared runner among those ones will be used to execute our jobs which is good from user perspective. Because
we simply define what the job should do(what commands it should execute) and as long as the runner that get selected for that job, knows how to
execute the commands in the job, we're fine.

![img.png](../img/section-2/0019_4-6.png)

In that list of shared runners section, you see a part for another type of runners, which are called `specific runners` and they are the runners for that
specific project that you're currently on it and none of the other projects on gitlab.com can use those specific runners , those runners are only
configured to execute pipeline jobs on that selected project.

![img.png](../img/section-2/0019_4-7.png)
![img.png](../img/section-2/0019_4-8.png)

and in the case of gitlab.com installation, it can be used to register self-managed or private runners, that only your gitlab projects can use and
one be shared or even displayed to other users on gitlab.com .
![img.png](../img/section-2/0019_4-9.png)

### override docker image:
The runner configuration section was one thing we wanted to learn. The second thing is related to docker machine executor and we saw in the previous logs that an image of ruby 2.5
was used to create containers for executing the jobs. Now the question is can we configure a different docker image for a docker or docker machine executor? Because as we said,
a big advantage of using docker executor or docker machine executor, is that you can use a ready image that already has a tool like npm or node or java installed on it and
use them to run job that needs that specific tool instead of having to install and configure them on the server directly. The question is if I wanted to run an npm command, how do I choose
an image that has npm inside it? and can we override it for the shared runners?

We can specify or overwrite default image that is used in pipeline configuration by using the `image` attribute in global space.

![img.png](../img/section-2/0019_4-10.png)

By specifying that image attr, it means that now every single job(because gitlab uses docker machine executor on all it's shared runners), will be executed in a container and for every single job,
that specified image will be used to execute them.

![img.png](../img/section-2/0019_4-11.png)

Now in gitlab jobs page, by clicking on one of the jobs, you see a log at the top that says:
`Using docker executor with image node:17-alpine` and this same image will be applied for each and every job in the pipeline.

Now in each job, we should have for example npm available because we're executing each job in a container with node image. So let's use use npm in script attr of an image.
Then commit the changes so that the pipeline executes.

Without that node image, if we try to execute an npm command in a container with the selected image by gitlab(which probably would be ruby 2.5), that job will fail.

So with docker executor or docker machine executor, we can use any image with preinstalled tool and then we have that tool or command available for our jobs.

The best practice when specifyign an image, is to always use a specific version.
![img.png](../img/section-2/0019_4-12.png)

We could theoretically say: `image: node` or `image: node:latest` , but in this case(node:latest), with every single execution, always the latest node version will be fetched and this
makes it unclear and not transparent exactly which node version we're using and also there could be a change in the image that breaks our pipeline, or it could also be that
our project needs a specific npm or node version, so we have to fixate the version.
![img.png](../img/section-2/0019_4-13.png)

So the best practice is to always use a specific tag and **the more specific, the better**. So this one is good: `image: node:17-alpine3.14` because
we know exactly which version is used and our pipeline execution will be always the same because we're using the same image version.

With exact version of image, our pipeline stays consistent and easily migratable and also we have a transparent documentation in our code.

Maybe we don't want to execute every single job in the same container with the same tools installed in them. For example a job needs npm and another jobs for building image needs
docker. In this case, you need image specification per job. So specify image attr in jobs. If there isn't any image specified for a job, it will use whatever default
image is for the docker executor or docker machine executor environment. Or we can use a combination of a specified global image attr and some image attrs defined in per job.
So we have this flexibility as well.
![img.png](../img/section-2/0019_4-14.png)

Let's say you have defined a global image attr for your pipeline, however your job gets executed on a runner that doesn't have docker or docker machine executor configured
on it. Let's say we uses a simple shell executor. So what happens in this scenario?
In this case, the image attrs will simply be ignored and the job will be executed on a shell executor.

![img.png](../img/section-2/0019_4-15.png)

## 0020_5_Specific_Runners_Runner_for_specific_project
### specific runners:
Let's say your team want to have separate runners dedicated to your project only. You don't want other projects pipelines to mess with it or use it.

![img.png](../img/section-2/0020_5-1.png)

So if a company has multiple project teams, one team may not want to share runners with other team and their projects and instead have their own isolated environment
for running the project jobs.
![img.png](../img/section-2/0020_5-2.png)

and there could be many reasons for that, like isolation for resources, security and ... .
![img.png](../img/section-2/0020_5-3.png)

and for that, we have this other type of runners called specific runners.

Specific runners are project specific. When you create them and register them, you can connect it to a project and make it available for specific projects and make
it available for only those projects.
![img.png](../img/section-2/0020_5-4.png)

So other projects that are also part of the same gitlab installation which the specific runner is registered with, can't use these specific runners and you can have one specific
runner dedicated to one or more projects. But again, you have to make that connection or basically unlock that runner and make available for each project **explicitly**.
![img.png](../img/section-2/0020_5-5.png)

While shared runners on gitlab.com are managed by gitlab itself, the specific runners will be self-managed. So if I want to configure specific runners for my projects on
gitlab.com , I have to manage them, create them and ... , myself and this means:
1) I will setup the machine
2) install a gitlab runner program on it
3) connect(register) that gitlab runner program to gitlab server instance
   and after these, we have our self hosted runner
   ![img.png](../img/section-2/0020_5-6.png)
   ![img.png](../img/section-2/0020_5-7.png)
   ![img.png](../img/section-2/0020_5-8.png)

So while the gitlab server itself is a complex software with multiple services, the gitlab runner itself has a relatively simple installation and setup process
and you can configure gitlab runner on any environment, this could be your laptop(local machine) or any remote machine(right side in image), any virtual machine(bottom of the image) on remote
cloud platform and ... . You can also install runner on any OS.
![img.png](../img/section-2/0020_5-9.png)
![img.png](../img/section-2/0020_5-10.png)

Once we have chosen a machine where we wanna install gitlab runner and we installed it, we then connect that gitlab runner or register it with the gitlab server for one of our git projects.

So registering a runner is the process that binds that runner with a specific gitlab instance and when you're registering a runner, you're basically setting up a connection
between your gitlab instance like gitlab.com and the machine where gitlab runner is installed.
![img.png](../img/section-2/0020_5-11.png)

Now we're gonna set up 2 specific self-managed gitlab runners, one on local machine and one on a remote machine on AWS EC2 instance and we will then use those two gitlab runners to execute
the jobs in our pipeline.
![img.png](../img/section-2/0020_5-12.png)
![img.png](../img/section-2/0020_5-13.png)

## 0021_6_Demo_Overview_Configure_self_managed_Runners
### runner configuration demo overview:
In this section, we will learn how to configure your own runners for gitlab and install any tools we want on them to use it in pipeline.
![img.png](../img/section-2/0021_6-1.png)


![img.png](../img/section-2/0021_6-2.png)
The local runner we're gonna install on our machine, in a actual real life use-case, can be for testing purposes. Plus many companies also have windows servers, so you may
need to configure a runner on windows machine, so you can learn how to do it. This will be our first runner.
![img.png](../img/section-2/0021_6-3.png)

After that, we will go to aws and create an EC2 instance or basically a virtual server with ubuntu OS and we're gonna configure a gitlab runner on that machine and this is a more
realistic scenario, where you configure a remote runner on a linux machine to connect it to your gitlab instance and we chose ubuntu, so that we can create
a server on any other cloud platform or server or virtual machine and as long as it's an ubuntu server, the installation will be the same. So again, if you have your own
server that you're using that is an ubuntu machine, you can use that instead of the EC2.

![img.png](../img/section-2/0021_6-4.png)
![img.png](../img/section-2/0021_6-5.png)

Important note: When we use aws services like EC2 instance, you will have to pay for that service.

Compute service == virtual machine
![img.png](../img/section-2/0021_6-6.png)

If you want to reduce the cost, you can stop and start the instance in between the learning sessions. Because on aws, currently, at this moment, you're not charged for an instance
which is not running and when you're done with the course, stop and maybe delete the instance to avoid any further cost.
![img.png](../img/section-2/0021_6-7.png)

Now let's configure local and remote runners.
![img.png](../img/section-2/0021_6-8.png)

## 0022_7_Install_Register_Local_Runner_on_MacOS
### install and configure macos local runner:
See the docs for the environment you want to install the local runner.

We're gonna use brew for this task.
Then run: `brew install gitlab-runner`

Then start the service with: `brew services start gitlab-runner`

With `brew services info <name of the service like gitlab-runner>`, we can check the status of a service.

We have installed gitlab-runner locally on our mac.

However, our gitlab installation itself(our gitlab account and the projects that we have there), doesn't know anything about this gitlab runner. Because we just installed a
program on a server(our local machine), it's not connected to the gitlab.com installation.
![img.png](../img/section-2/0022_7-2.png)

For checking if a runner is connected to our gitlab installation, go to settings>CI/CD , runners section then look at specific runners, currently we would have an empty
list. So we need to connect them in order to use it.

To connect it, run: `gitlab-runner register`. First it asks which gitlab instance we want to connect it to?
So if a company has it's own gitlab installation, then obviously you have the URL of your gitlab installation. In this case, the url is: https://gitlab.com (our gitlab instance).

Then add the registration token to use to register any specific runner.

Now we have to configure a couple of metadata about the runner itself. For description, you can say: `local-runner`.
![img.png](../img/section-2/0022_7-3.png)

The tags part is important and we're gonna see why. In our case, just enter some descriptive tags. Let's add a tag called `macos` to say it's a macos runner and also a tag
called `local`. So we know it's a macos runner installation and it's a local runner. So write: `macos, local` for tags part.
![img.png](../img/section-2/0022_7-4.png)

Then you can write some additional notes. For example: `This runner uses shell executor`.

Then we need to choose an executor.

**Note: Each runner can have exactly 1 executor.**

For local runners, we're gonna choose the shell executor. So type `shell` in this part.

Now the runner is runner and you don't have to reload it.

Now in gitlab CI/CD settings, reload the page to see our local runner
![img.png](../img/section-2/0022_7-5.png)

Now we have 1 specific runner available for our project.
![img.png](../img/section-2/0022_7-6.png)

## 0023_8_Install_Register_Local_Runner_on_Windows

## 0024_9_AWS_Pre_Requisites-
For this course, you need an aws account and once you have an account, you get a free tier offer from aws. What it means?
You can use some of the services for free.
![img.png](../img/section-2/0024_9-1.png)
![img.png](../img/section-2/0024_9-2.png)

By default, when you create an account on aws, you have a ROOT user. This user gets created automatically and this user has access to all the services and all
the features. So it has unlimited privileges to whatever you want in your account, including the billing part, account settings and ... .

So the first thing we want to do when the account is registered, is create an admin user that has less privileges than root user, but it will have all the
privileges that we need to create EC2 instance, deploy some applications on that and this is the first thing that aws also advises to do for security reasons.
For this, go to `IAM` service, you will see the configuration dashboard.
We can create users, groups and permissions there and manage all the stuff there.

Now admin user, can also have permission to create users, assign the roles to them and ... . So you can have one admin user to manage and administer the whole
aws account, but it will still have less privileges than the root user, for example, it will not be able to access the billing and credit card information and then using that
admin user, you can create other users and give them other permissions for team members. For example if you have a devops team that all use aws and
configure stuff from there, obviously you need to give them all permissions and access to EC2 and maybe some other services. So the admin user is the one
that administers all of this.
![img.png](../img/section-2/0024_9-3.png)

### create an IAM user - admin user:
Let's create an admin user that has admin privileges to do stuff on aws services. **We don't need a group for that because it's just gonna be 1 user and the only
one with admin access**. Go to access management>Users> add user and note we can give a user 2 types of access:
- access through the console in the UI. So you can login on the UI and then do stuff through the UI like configure stuff and ...
- a programmatic access. This is when you can execute different tasks from your CLI and this can be either through aws command line interface or in our case, we're gonna use
  terraform commands to access aws. So we need programmatic access for the admin user to execute terraform commands and you can decide whether a user has
  one of those access types or maybe both. In this case, we can give admin both types of access, because we want to be able to access the UI console with it, so we want to be able
  to login with this user(so we need a password for this case for user as well), but also execute things from command line.
  By checking `the User must create a new password at next sign-in` checkbox, we can force the user on the first login, to reset his password.

So the UI access will be through username and password and the programmatic access will be with keys.

It is a best practice to have all the users in a group and then to assign permissions to the group, rather than directly to the user. But the admin user is gonna be the only one in
the group, so we can skip creation of group for him, so we can assign a permission to the user directly and for that go to `attach existing policies directly` and you're gonna see a list of
all the permissions or policies and there you can decide for each service, what type of access you want to grant a user and this is good because it supports the
best practice of giving the user the least privilege they need.

Admin user is gonna get administrator access which includes all the policies and all the permissions that are needed for administering your aws account.

So check `AdministrationAcess` option and go to next page.

You can add tags to the user, which is additional info like metadata about the user. If this user is individual team member of your organization, this metadata could be email address,
description or job title, names and ... .

The access key ID and secret access key are the keys to access the aws account and the services from the command line. So save all those info after creating the user, securely by downloading the csv.
![img.png](../img/section-2/0024_9-4.png)

Then, login to UI using username and password and then change the password, because we have configured it this way.

### login with admin user:
Let's sign out as ROOT user and login as admin user(in sign in page select IAM user).

### Note: UI experiments:
aws changes UI very often, also in real-time for different users.

### Understand some important AWS concepts:
Let's see what VPC and subnet resources are on aws as well as internet gateway resource, security group and ... .
![img.png](../img/section-2/0024_9-5.png)

### virtual private cloud:
Whenever you create an account, in each region you will have sth called a vpc.
![img.png](../img/section-2/0024_9-6.png)
![img.png](../img/section-2/0024_9-7.png)

vpc in aws is basically your private network. When you create resources, virtual servers and ... on aws, you obviously don't want other aws users or other aws accounts to
have access to your resources, you want to protect them and you want only you to have access to them. Because of that, you can create this virtual private cloud on
aws infrastructure that only you have access to and you create this VPC in a specific aws region.
![img.png](../img/section-2/0024_9-8.png)

For example in Paris region in eu-west-3, we can create as many VPCs as we want. However, region in aws consists of multiple availability zones.

Availability zone in simple words, is a datacenter of aws with all those servers that run the whole infra.
![img.png](../img/section-2/0024_9-9.png)
![img.png](../img/section-2/0024_9-10.png)

So the virtual machines that you spin up in your aws, will actually run in one of those AZs, because these are the actual physical locations where the servers will run.
So VPC will span all the availability zones in that specific region. For example Paris has 3 zones and vpc spans all these 3 zones.
![img.png](../img/section-2/0024_9-11.png)

So in each region, VPC isolates a space where you're creating your virtual instances, your servers, maybe DB instance, some other components, from different services, because
obviously this is a datacenter where others also rent virtual servers, other components, so they might be running on the same physical machine(computer), but they will be isolated
in private networks, with VPCs.
![img.png](../img/section-2/0024_9-12.png)

For big corporations that have much more complex application setups, they can use multiple VPCs and manage multiple of these private networks in different regions.
![img.png](../img/section-2/0024_9-13.png)

Now what does this VPC include?
It is basically a virtual representation of network infra. When you have servers physically in your company which was a traditional way of hosting servers and applications before cloud,
you have sys administrators that set up, configure and manage this whole network. They set up the router, they do all the network configuration, configure firewall and ... . So all of this
physical network infra, is now moved in cloud and VPC is representation of this and the reason why we have this default VPC in each region, is that whenever you create an EC2 instance,
it has to run inside a VPC. Or whatever component you're launching, it has to run or start inside a VPC.
![img.png](../img/section-2/0024_9-14.png)

Subnets: Subnets are subnetworks. So VPC is whole private network and subnets are components or sub-networks of the VPC.
![img.png](../img/section-2/0024_9-15.png)

While VPC spans the whole region, all the availability zones, subnets span individual availability zones.

So for each 3 zones that we had in the image, you'll have their own subnet. So subnet is like a private network inside a network.
![img.png](../img/section-2/0024_9-16.png)

Another interesting thing in VPC part is that obviously whenever you create a virtual server, it has to get an IP address and in VPC, you have a **range** of private or internal
IP addresses and that range is also defined by default and you can even change it.
![img.png](../img/section-2/0024_9-17.png)

So go to VPC in aws website, you will see a range of IP addresses(where the cursor is in the image below):
![img.png](../img/section-2/0024_9-18.png)
So whenever you create a new EC2 instance, an ip address will be assigned to it from for example the range the cursor is on it in the image above. So internal or
private IP address is not for internet traffic, but rather for traffic inside the VPC. So when you have multiple servers, components, inside the VPC, they need to communicate
with each other right? For example, you have an instance for web app, another instance with DB app, ... they all need to communicate. **So private IP address is what allows
them to talk to each other.**
![img.png](../img/section-2/0024_9-19.png)

So the IP address range is defined on a VPC level and then each subnet then gets it's own private IP address range from that total range(like a sub-range).
![img.png](../img/section-2/0024_9-20.png)
Here you see those sub-ranges defined:
![img.png](../img/section-2/0024_9-21.png)
Now obviously, when we deploy our web app on EC2 instance, we want it to be accessible from internet(outside) and for that, in addition to private IP address,
we need to assign it a public IP address and this is also configured in VPC service. So when we create an EC2 instance, it will get a private IP address from the range of the
subnet inside which that instance will start and it will also a public IP address. Internal one for internal communication inside the VPC and a public IP address for accessing
it through the browser.
![img.png](../img/section-2/0024_9-21.png)

For allowing internet connectivity with your VPC, you also have an internet gateway component. It connects VPC to internet(outside world), so that you can get traffic
inside your VPC, for example to your web service and you can also send traffic outside(if you want to download some stuff from internet on your components or ... ).

![img.png](../img/section-2/0024_9-22.png)

Now obviously, in addition to all of this network configuration, we need to **secure** our **components**. For example we want to control what traffic enters your VPC, or what
traffic reaches individual instances and components **in** your VPC or in your subnets and you want to control what traffic goes out. So basically, this is a **firewall** configuration for
your VPC and for individual instances.
![img.png](../img/section-2/0024_9-23.png)

You can configure that security control on multiple levels in VPC and aws mix it flexible and granular of how you can configure all of this stuff, not just security but the IP address ranges,
the route tables and ... and that's why you have that big list of things inside virtual private cloud. However in many cases, you will not need some advanced
network configs, most of the stuff is configured by default and in most simple apps you will not need to do any configs here and since this whole network is private and by default closed to the
outside world, there is no access from internet. Of course for your web apps, you want to configure some internet access as well as you want to SSH into your servers from laptop,
so you want to configure some kind of external access and for that, you have components inside that VPC service called network access control list(NACL) which are
basically firewalls or firewall rules for subnets, so you can configure these per subnet and in addition to that, you have security groups which are again firewall rules but on a
virtual machine level. So inside the VPC, we have the subnet(can be multiple) and inside subnets we're gonna have EC2 instances which are virtual servers and we can configure firewall rules on that
virtual server level using security groups. So you create both of these components on a VPC level and then you assign the NACLs to individual subnets and assign security groups to
individual instances or components inside that VPC.
![img.png](../img/section-2/0024_9-24.png)
![img.png](../img/section-2/0024_9-25.png)

## 0025_10_Install_Register_an_AWS_EC2_Run-
### install and configure an EC2 instance:
Now we have one local runner that is connected to the gitlab.com instance and depending on your OS, this is either a macOS, windows or linux local runner.

Now we want to configure a second specific runner, which is gonna be on a remote machine and for that, we're gonna choose ubuntu distro on AWS EC2 instance.
![img.png](../img/section-2/0025_10-1.png)
### setup EC2 instance on AWS:
We have set up an AWS account and the basics of creating and configuring virtual machines on aws platform. Now in aws site, create a new EC2 instance using launch instances button.

We want to make it as generic as possible, so that we can use any machine anywhere we want, not necessarily on aws and that's why we're gonna go with ubuntu 20.04 version and create an
instance from that. Select 64-bit(x86).
![img.png](../img/section-2/0025_10-2.png)

Then choose the one with free tier eligible tag. Now we can launch a new instance. So click on `Review and Launch`.
![img.png](../img/section-2/0025_10-3.png)

In the next page, we can see the operating system image that we selected and one thing that is important for us, is to have a security group configuration
that allows access to our machine on an SSH port(in image that port is port 22), because we're gonna have to SSH into that server in order to install
the gitlab runner and anything else that we need.

![img.png](../img/section-2/0025_10-4.png)
So make sure that ssh port(22 in picture) is open.

Now this configuration opens it for **any** IP address but you can limit it to your own IP address. You can do that using edit security group config:
![img.png](../img/section-2/0025_10-5.png)
So basically just type in your own IP address, so that only you have access to it. We're gonna leave it to that because this is just a test instance and we're gonna delete it
later.
![img.png](../img/section-2/0025_10-6.png)

Now if you click on `launch`, we're gonna have to do one more thing and that is create a key pair, which is an SSH key pair for our instance and we need that because
we're gonna SSH into our server, in order to install any packages and tools and in order to access or authenticate with the server, we need private public key pair
for that instance and then we're gonna login or SSH into the server using the private key of that keypair.

So select the `create a new key pair` option and then give it a name on the second input(look at 0025_10-8.

![img.png](../img/section-2/0025_10-7.png)
![img.png](../img/section-2/0025_10-8.png)

This will download a pem file and once we have that, we can click on `Launch instances`.

![img.png](../img/section-2/0025_10-8.png)

We have the instance that is being created, it's in a pending state:
![img.png](../img/section-2/0025_10-9.png)

It has port 22 open, so we can SSH to it and we have the key(downloaded private key) that will allow us to authenticate with the server.
![img.png](../img/section-2/0025_10-10.png)

After some time, it's in the running state(`instance state`), let's also wait for the `Status Check` to become have all the checks passed and fully initialized and then we can SSH to it.
![img.png](../img/section-2/0025_10-11.png)

Now let's SSH into our server and install the gitlab runner on it.

### Connect to the EC2 instance:
You can get the full SSH command for connecting to your instance, by clicking inside the row of that instance and then click on that connect button on top.
![img.png](../img/section-2/0025_10-12.png)
![img.png](../img/section-2/0025_10-13.png)
![img.png](../img/section-2/0025_10-14.png)
In the picture(0025_10-14), the string after @, is the public DNS name and the `gitlab-runner-key.pem` is the private key name that we configured and the default user for connecting
to our ubuntu EC2 instance, is `ubuntu`. Copy that string and run in your terminal with some changes:
Locate your gitlab runner key and change the path to get it(we don't need the quotes so we can remove it in the command) and instead of that long DNS name,
in the page where instance info is shown, you can see the public IP address(Public IPV4 address) as well as public DNS name(Public IPV4 DNS) and currently in the command, we're using public DNS name,
let's use public IP address instead of DNS name(the highlighted value in image below):
![img.png](../img/section-2/0025_10-15.png)

After executing the command, we will get an error that says our key is unprotected:
![img.png](../img/section-2/0025_10-16.png)

The problem is that the pem file or the private key file that we use for SSHing into the server, needs to have limited permissions. So not everyone should be allowed to
have access to it.

![img.png](../img/section-2/0025_10-17.png)

So right now, if we execute:
```shell
ls -l <path to downloaded pem file like: ~/Downloads/gitlab-runner-key.pem>
```
you see that everyone is allowed to read that file. So we need to remove that permission and make it available only for the owner(the owner in image is `nanajanashia`)
![img.png](../img/section-2/0025_10-18.png)

and to do that, run: `chmod 400 <path to the pem file>`. So we're giving 0 permission. So no read permission for anyone else other than the owner. Now the result would be:
![img.png](../img/section-2/0025_10-19.png)
So now **only** the owner is able to **only** read the file. This is limited enough.

Now if we rerun the SSH command, we should be able to enter the server. Now we're on aws EC2 machine with ubuntu user and the private IP address(or private domain name - private
DNS name) of the server that is highlighted in the image below.
![img.png](../img/section-2/0025_10-20.png)

You can check that in aws page:
![img.png](../img/section-2/0025_10-21.png)

### configure and register gitlab runner:
Now that we're on the ubuntu server, the first thing always to do(whatever your're doing or configuring), is to do: `sudo apt-get update` before we install anything.
![img.png](../img/section-2/0025_10-22.png)

Then see how to install gitlab runner on an ubuntu machine). Go to the **official linux packages** page on gitlab docs.

There would be a curl command to run first.

Usually when you're configuring thi stuff, you should always reference the official docs with latest version.
![img.png](../img/section-2/0025_10-23.png)

Follow the docs for installation.

Now we have installed gitlab runner and we can check this by running: `sudo gitlab-runner -version` and `sudo gitlab-runner -status`.
![img.png](../img/section-2/0025_10-24.png)

The first part is done(gitlab runner is installed). Now we need to register our runner.

So run: `sudo gitlab-runner register`. Then:
1) Specify the url of gitlab instance that we're connecting to. Like https://gitlab.com/
2) registration token(get it from settings/ci-cd page of gitlab instance)
3) description for the runner - like ec2-runner
4) tags for runner which describe this runner - like `ec2, aws, remote`
5) optional note(we can add notes for maintenance of the runner) - like The runner is using shell executor
6) then choose the executor type - like `shell`

Now runner is registered successfully.
![img.png](../img/section-2/0025_10-25.png)

Now we can run: `sudo gitlab-runner start` to make sure it's reloaded.

Now we should have a second runner in our project's CD/CD settings, connected to our gitlab instance in gitlab.com . For confirming this, go to your gitlab instance and runners settings.

![img.png](../img/section-2/0025_10-26.png)

## 0026_11_Execute_jobs_on_specific_Runner_Tags
### execute jobs on specific runners:
Now we have added 2 private runners to our gitlab installation on gitlab.com and we can see that they have added to the project's list of specific runners.
![img.png](../img/section-2/0026_11-1.png)

### Default behavior:
Now when we run our pipeline, let's see how and where it gets executed?

In pipelines page, manually trigger it by clicking on the `Run pipeline` button. We're running it for the main branch and not providing any variables.
It was successfully executed, not let's go to inside a job and let's check the logs for info about the runner on which the job executed and as you see in the picture below,
it was executed again on shared runners that gitlab provides us with and this goes for each and every job that we check.

![img.png](../img/section-2/0026_11-2.png)

So all the pipeline jobs get executed on randomly selected gitlab's shared runners, even though we have configured project specific self-managed runners. So basically those two
specific runners were ignored and this is the default behavior.
![img.png](../img/section-2/0026_11-3.png)
![img.png](../img/section-2/0026_11-4.png)
So by default, the shared runners will be used. However, we do want to use our private runners instead that we configured and not rely on the shared runners.

So how can we configure that? How can we make our jobs run on our specific runners instead?

### select runner with "tags":
Remember when we registered the runners, we added tags that our displayed in specific runners section of settings page. Which served to identify specific runners and to basically
differentiate them from each other and we use those tags to reference a runner where our job will be executed.
![img.png](../img/section-2/0026_11-5.png)
![img.png](../img/section-2/0026_11-6.png)

For doing it, go to pipeline definition file and for each job we can define on which specific runner, we want to execute that job and we do this by using the `tags` attr on job and specifying
all the tags of that runner. So that's how we reference a runner inside job.
![img.png](../img/section-2/0026_11-7.png)

This config will make that job to be executed on our specific ec2 runner and we can repeat that on each and every job.
```yaml
  tags:
    - ec2
    - aws
    - remote
```

Now currently we have an addition config that we configured for a docker executor or docker machine executor on shared runners which is the `image` attr. Currently we have a global
image attr for whole pipeline and we have one image attr defined for a specific job to overwrite that global one. Now as we said, if a job executes on a
runner that doesn't have docker or docker machine executor, then that image attr defined in pipeline will be **ignored** and since we're using a shell executor on the
runner that we specified with `tags` attr for one job(which that job definition also has the image attr defined for it, so it needs a runner with docker or docker machine executor),
that image attr for that job will be ignored. So we can remove that image attr if we don't need it and we can leave the global image attr(it will be
ignored if the runner doesn't have a docker or docker machine executor).

Let's execute the pipeline with this new config and see that our jobs get executed on the specified specific runners(the jobs that actually have that `tags` attr).
Now we get a failure on running the job on our self-managed EC2 runner and it's because we don't have npm command available on our EC2 runner.
![img.png](../img/section-2/0026_11-8.png)

and this brings us to the next topic, when we use our self-managed runners for executing the jobs, we need to make sure that any tools that this job needs,
have to be available there. So if we need npm in the job, we have to go and install npm on our self-managed runner.
![img.png](../img/section-2/0026_11-8.png)

To do this, let's connect to our remote runner using `ssh` command:
![img.png](../img/section-2/0026_11-9.png)

Now let's install nodejs and npm:
```shell
sudo apt update
sudo apt install nodejs
node -v
# npm should come with node but anyway let's install it:
sudo apt install npm
npm -v
```
Now any job that executes on this runner, should have access to npm command. Now let's re-execute the pipeline manually by clicking on that button.

Let's say we have different tools installed and configured on those 2 remote EC2 runner and the local runner. Let's say our EC2 runner has nodejs and npm installed on it,
while our local runner has some other tools that we need for building, pushing and deploying an image. So we're gonna distribute our jobs among the runners.

So let's say `run_unit_tests` and `run_lint_tests` jobs get executed on the remote runner and the final 3 jobs(`build_image`, `push_image` and `deploy_image`) will be executed on the local runner.
For this, change the tags attr values of those jobs.

Then execute the pipeline again.

So using tags, we have this flexibility of deciding which specific job will be executed on which runner and using this approach, we can also share the load among the runners and basically
send some of the jobs to one runner and other jobs to another one.

![img.png](../img/section-2/0026_11-10.png)

Let's see what are other use cases for having multiple runners for the same pipeline and how it may look like in a real project?

### Some real-life use cases:
Let's say we have 20 runners in our gitlab setup that we're managing ourselves and we have connected them to gitlab instance. We may want to configure each runner to do a different
thing. For example, we may have a windows runner with a shell executor and another linux runner with docker executor and some other runners with a k8s executor and if we
have a job that needs to execute on a windows machine or in a k8s cluster or ... , we can send that job exactly to the runner that has everything configured for that.
THis gives you flexibility of how you can execute your jobs.
![img.png](../img/section-2/0026_11-10.png)

Now OFC in any setup, you also care about scalability. Like if you have a windows runner for all your jobs that need windows OS and the server where that
windows runner is configured fails, any of your jobs with windows runner tag won't have a proper runner to execute on. So usually, you would have 2 or more
runners of the same type with the same tags and their job that references those tags, will be executed on one of the runners. This way you also have high availability
of your runners and of your gitlab setup.
![img.png](../img/section-2/0026_11-12.png)
![img.png](../img/section-2/0026_11-13.png)

However, if you have a simple pipeline for all your project and you don't need any special execution environment for your jobs and you're basically fine with the same
exact execution env, it's also common to have multiple interchangeable runners. Like 20 linux runners with the docker executor and all your jobs will be executed on the
same env and in this case, you have an advantage of distributing the load of job execution among all these runners.
![img.png](../img/section-2/0026_11-14.png)

So both of these senarios, are completely valid and common in real projects.
![img.png](../img/section-2/0026_11-15.png)

## 0027_12_Add_Docker_Runner_on_EC2_Instance
### Add runner with docker executor:
Let's say we don't want to install and manage these nodejs and npm programs on the runner's OS directly. Instead, we want to execute it with docker. So we will have
the local runner like macos or windows with shell executor, to run some OS specific jobs and the rest of the jobs should be executed in docker containers on a remote runner and
this means we need to add a new runner with a docker executor, so we have a docker executor env available for our pipeline jobs and as I said, we can add
multiple runners on the same host or the same server and since we have that EC2 instance already, currently with one runner with the shell executor, we can add and
register another one with a different executor.

![img.png](../img/section-2/0027_12-1.png)

### register new runner:
Before we can register a new runner with docker executor(in our case), we need to first install docker. **Because the runner will have to create docker containers to run the jobs.** Which means
we need docker available on the machines to create those containers. So instead of having to install all the tools like java, npm or whatever we need for our
jobs, we just have docker installed and everything else, all other tools, will be available through docker images.

Let's install docker on our EC2 server. If you do `docker ps`, whatever command suggestion of how to install docker you see, run it, which is: `sudo apt install docker.io`.
Now if you do: `docker ps`, we will still get an error because we can't execute docker commands using ubuntu user. We can only execute it using sudo commands:
`sudo docker ps` which means docker daemon is running, so the service is running:
![img.png](../img/section-2/0027_12-2.png)

However, we also want to `ubuntu` user to have permission to execute the `docker` command. For that, we need to add ubuntu user to docker group by running:
`sudo usermod -aG docker $USER` which is changing the current user(which would be ubuntu in case of our EC2 that we're connected to) and adding it to a group called `docker`.
Now if we logout from the EC2 server by running: `exit` which after running it, the terminal would print: `Connection to <ip like 35.180.126.162> closed.`
Then login again by running: `ssh -i <path to pem file like: ~/Downloads/gitlab-runner-key.pem> ubuntu@35.180.126.162`

Now we can execute: `docker ps` using ubuntu user without sudo.

Docker is configured, let's now register a new runner with docker executor:
`sudo gitlab-runner register`
Then provide the usual info about a runner:
- gitlab instance url: https://gitlab.com/
- registration token which is in gitlab instance settings and in specific runners section
- description for the runner: ec2-docker-runner
- tags: These tags should be different than the ones that our other ec2 instance has(with shell executor), because we want to differentiate them and make each
  runner specifically identifiable, because they are different. So add: `ec2, docker, remote` as tags. So docker is a tag that uniquely identifies this new runner which that other
  runner that is on ec2, doesn't have.
- leave maintenance note, empty.
- as executor type, choose `docker`.
- and for the docker executor, we also have to choose a default image and choose `alpine:3.15.1`

Now runner is registered successfully.

Now restart the runner: `sudo gitlab-runner start`

Now we have a third runner.

As for tags, you can write a tag for executor type to know which execution env that runner has and also we can change the tags and other params of runners from administration UI.
![img.png](../img/section-2/0027_12-3.png)

Now our runners are:
![img.png](../img/section-2/0027_12-4.png)

### Adjust pipeline to use the docker runner:
Now let's use the docker runner(our specific docker runner on EC2 instance) to execute the npm command in the docker executor instead of directly on the OS.
So in pipeline config, in `run_lint_tests` job, select the runner with docker executor by specifying it's tags.

The `run_unit_tests` job needs an image that has npm installed, so we can use: **node17-alpine3.14**. This image will be applied to the executor that we specified there(which needs
an image right? Because it's a docker executor, so we specified it a docker image). So `image: node17-alpine3.14` will be used to create a container, in which
the job will be executed.

`run_lint_tests` ran on ec2 runner with shell executor. `run_unit_tests` ran on ec2 runner with docker executor.

`build_image` were executed on a local runner with shell executor and ... . So we have this flexibility of what we execute where and how, by using `tags` and `multiple runners`.



## 0028_13_Group_Runners_Runner_for_a_GitLab_Group
### Group runners:
### specific runners for multiple projects?
We have configured 3 specific runners for our project. But let's consider this usecase:
For our project, each one of the specific runners is specifically dedicated to that project and when you edit a runner, you have a option for `unlock this runner for
other projects`. So we can reuse the same runner for other projects, by unlocking that runner.
![img.png](../img/section-2/0028_13-1.png)

But let's consider this use-case:
Let's imagine we're developing an online shop app and it is made up of multiple microservices and we have a separate project(repo) for each one of those microservices.
Let's say there are 20 microservices and each one has it's own pipeline. Now we could unlock each one of those specific runners and assign it one by one to all those
20 microservices. But it's difficult to maintain!
![img.png](../img/section-2/0028_13-2.png)
![img.png](../img/section-2/0028_13-3.png)

For this scenario, we have a concept of group runners.
![img.png](../img/section-2/0028_13-4.png)

### Groups in gitlab:
In gitlab you have projects(individual repos) and then you have groups:
![img.png](../img/section-2/0028_13-5.png)

Groups in gitlab are meant to group multiple individual projects that belong together.
![img.png](../img/section-2/0028_13-6.png)

In your comapny you may have multiple teams and each one of those teams, may have multiple projects. So this would be a really good way to group all the projects that different
teams manage and this could be microservices for the same app, you may have some supporting libraries and custom frameworks for your app, or you may also have
additional repos or projects for infrastructures code, like terraform scripts, ansible scripts that provision infra for your app and then configure it and deploy it on that infra
and that's a good way to group all the projects that belong to the same team.
![img.png](../img/section-2/0028_13-7.png)

and you can create a group by going to top menu hamburger icon and hover groups and `Create group` and then within that group, you can create projects(for example, all your
microservices, you may have infrastructure's code repo, library code and ...) and the good thing about it is that you can manage the access permissions for the whole
group of the projects, instead of managing the access for each individual project. So you can configure your team member access permissions on group level.

### What is group runners and how to configure it:
You can configure CI/CD pipelines for all the projects in a group and you may want to share runners among all these projects within the same group.
So in the team, you may have one administrator that will configure all these runners for the whole group and then make those runners available
for the projects in that group and this will be group runners.
![img.png](../img/section-2/0028_13-8.png)

How do we configure a group runner?
Go to the group, then settings>CI/CD> runners> group runners
In that settings page, shared runners are the runners that are available from gitlab and there you have group runners instead of specific runners.

### Demo- group runner:
We're gonna see a demo of creating a group with microservices and configuring a group runner for those microservices later. But now, we're gonna look at more
theoretical concepts of group runners.
![img.png](../img/section-2/0028_13-9.png)
![img.png](../img/section-2/0028_13-10.png)

## 0029_14_Self_Managed_GitLab_Instance
Till now, we saw that we have gitlab software as a service instance, where we can host our repos and we can build CI/CD pipelines directly on that that
utilize gittlab's managed shared runners, but in addition to that, we can configure and add specific and group runners which we will manage ourselves, to that
gitlab.com's instance. So we have our own runners that non of the gitlab users will have access to and that will be specifically dedicated to our projects.
![img.png](../img/section-2/0029_14-1.png)

But let's say in addition to managing the runners ourselves, we also want to run and configure the gitlab **server** ourselves. So the whole gitlab instance
and the specific and group runners, this whole setup we want to manage ourselves and there are a lot of use cases for that such as high security.
So you want absolute isolation from all other gitlab users. Maybe you need absolute control over your gitlab setup and the underlying infra. Or maybe you want to
automate this whole thing as part of your devops processes.
![img.png](../img/section-2/0029_14-2.png)

Maybe you already have servers that you pay for, so you want to use them instead of paying additionally to gitlab. Maybe you just want to save infra cost, because
gitlab managing this for you, actually cost you some money. So there are reasons why we would want to have a self-managed gitlab instance in your company.
![img.png](../img/section-2/0029_14-3.png)

On that self-managed gitlab instance, all the company teams can host their git repos and configure the CI/CD pipelines for them.
![img.png](../img/section-2/0029_14-4.png)

So it will work pretty much in the same way, by it will completely managed  by your administrators.

And for those projects that you host on your gitlab installation, you can create self-managed runners which you can attach to your gitlab installation.

For the self-hosted gitlab instance, in addition to specific and group runners that we saw in the gitlab.com installation, you can also register your own
**self-managed shared** runners.
![img.png](../img/section-2/0029_14-5.png)

## 0030_15_Note_on_GitLab_Runner_Versions_Compatibility
### Gitlab runner versions:
Note about gitlab runners and gitlab instance that these runners are connected to and regarding the verisons of the runners:
Gitlab server or gitlab installation is a different program that is installed on a separate machine that manages the whole gitlab setup and
gitlab runner is a different program that we install on other servers and then we connect it or register it to the gitlab instance.
![img.png](../img/section-2/0030_15-1.png)

So these are 2 separate programs with their own versions. So the question is: How do we make sure that the versions of these 2(gitlab runners and
gitlab server) are in sync and compatible especially when we manage the setup ourselves? So for example it could be that gitlab.com platform updates the
gitlab server version to for example 14.10, but we have a self-managed specific or group runner that is running with an outdated version.

So what are the compatibility rules here?
![img.png](../img/section-2/0030_15-2.png)

For compatibility reasons, the gitlab runner major.minor version should stay in sync with the gitlab's major.minor version and it could be that all the runners
may still work with the new gitlab version and vice-versa, however, they could be some features that may not be available or may not work properly, if these versions
differ from each other.

Gitlab guarantees the backward compatibility between the minor version updates, but again, it could be that in a minor version update a new feature gets added
to gitlab that can only be executed and used on a gitlab runner with the same minor version and again for this scenario that we're using
gitlab.com and we have our own self-managed runners, gitlab suggests to keep the runner updated to the latest version, because again gitlab.com also gets updated
continuously, so you have to make sure your runners are also up to date, so that everything works properly and also the new features of gitlab can be used there.
![img.png](../img/section-2/0030_15-3.png)
![img.png](../img/section-2/0030_15-4.png)
![img.png](../img/section-2/0030_15-5.png)

## 0031_16_GitLab_Architecture_Recap
### recap setup & architecture:
We have 2 different conflations of gitlab setup(2 different gitlab setups):
- One is gitlab on software as a service offering which is gitlab.com where all of the gitlab users have account and can create repos and configure pipelines.
- second one is a completely self-managed gitlab installation and this is common in companies because companies want to have control over their
  repos and they want to host them on their own infra and own data centers.
  ![img.png](../img/section-2/0031_16-1.png)

On the second level, once we have that gitlab installation in place(using one of the approaches), with projects and CI/CD pipelines, for those CI/CD pipelines,
we would need to configure gitlab runners and we have 3 types of runners that can be registered with the gitlab instance:
- shared runners which gitlab.com instance provides us out of the box as a managed shared runner.
- specific runner for one or more specific projects
- group runner for a gitlab group which can be shared by all the projects repos in that group and for a self-managed gitlab installation, we have to OFC manage the
  shared runners also ourselves and on those runners, we then have executors which are the ones that execute the jobs and the number of types of executors may change but the
  most common and important ones are:
- shell executor which execute the jobs directly on the OS of the runner whether it's windows, macos or linux
- docker and docker machine executors which execute the jobs inside docker containers
- virtual machine executor which executes jobs in virtual machine environment
- k8s executor that will run the jobs in k8s pods
- and other types of executors
  ![img.png](../img/section-2/0031_16-2.png)
  ![img.png](../img/section-2/0031_16-3.png)
  ![img.png](../img/section-2/0031_16-4.png)
  ![img.png](../img/section-2/0031_16-5.png)
  ![img.png](../img/section-2/0031_16-6.png)
  ![img.png](../img/section-2/0031_16-7.png)
  ![img.png](../img/section-2/0031_16-8.png)

As an administrator of gitlab installation, you have to create those runners, register them with the instance and make them available for your developers and then
once those runners are available, devs of the apps will configuring the CI/CD pipelines, have all the flexibility to decide which job executes where, on which runner, with
which executor, which docker image will be used for a docker executor env and ... and we reference the runners for each job using the tags that get applied to them when we register
a runner.
![img.png](../img/section-2/0031_16-9.png)