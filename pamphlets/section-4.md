## 0038_1_Section_Overview
At this point, our pineapple looks like this:
we have 3 stages, where we run the tests and then building and pushing the image and deploying it to the dev server.

We have created a basic version of a deployment pipeline for our demo app.
![img.png](../img/section-4/0038_1-1.png)

In this chapter, we will add some stuff to pipeline, do some optimizations and make it closer to a real life pipeline:
![img.png](../img/section-4/0038_1-2.png)

How?

By first adding logic to dynamically set and incremented version everytime we build the image. So we have a new version tag for our image whenever we
execute the pipeline:

![img.png](../img/section-4/0038_1-3.png)

and we're gonna add 3 more steps or 3 more jobs to our pipeline.

First we're gonna add static security analysis tests for our app(a sast):
![img.png](../img/section-4/0038_1-4.png)

and then we're gonna add 2 more steps to promote the application changes from development to staging environment and then from staging to production env.
![img.png](../img/section-4/0038_1-5.png)
![img.png](../img/section-4/0038_1-6.png)

## 0039_2_Configure_Dynamic_Versioning_for_Docker_Image

### dynamic versioning:
Currently, we have a hard-coded image tag(IMAGE_TAB variable) that we had to manually adjust in order to build an image with a different version or with an
incremented version. Otherwise, if we do not increment this version, we will be creating the same image tags and we will
be **overwriting** the image in our container registry, over and over again.


![img.png](../img/section-4/0039_2-1.png)

The idea is that everytime a pipeline runs, a new image with a new image tag gets built and pushed to the repo. Because as we develop the app and as we make
changes, of course we want to keep track of those changes and version them. So we're gonna have multiple versions of our docker image and for example if the latest image
didn't work, we can revert or roll-back to the previous working version. However, we want to automate this process of setting the new incremented version for our image tag.
We don't want to have to set that image tag manually each time.
![img.png](../img/section-4/0039_2-2.png)
![img.png](../img/section-4/0039_2-3.png)
![img.png](../img/section-4/0039_2-4.png)

So we're gonna add the logic that sets the new image version everytime the pipeline runs.

![img.png](../img/section-4/0039_2-5.png)

Let's see how versioning applications works in general?
### Application versioning in general:
For versioning applications, we have multiple options.

Different teams use different version schemas and approaches to that, but a standard very common versioning schema is made up of 3 numbers.


![img.png](../img/section-4/0039_2-6.png)
![img.png](../img/section-4/0039_2-7.png)

![img.png](../img/section-4/0039_2-8.png)

We use npm and the configuration file of that is package.json and that is where the version of the app is usually defined.

Usually the image tag is based on the application version which is defined in that config file(in case of nodejs, that file is package.json).
![img.png](../img/section-4/0039_2-9.png)

So when we make application changes in the code, depending on whether these are major changes or minor or patch, we're gonna increment the respective number
of that version.

### read version from package.json:
In .gitlab-ci.yml , we want to read the app version which is defined in package.json's `version` property, programmatically.
So in the job where we build the image(`build_image` job), instead of having that hard coded image tag variable(`IMAGE_TAG`), remove it, we want to read the app version
from package.json programmatically. By using `cat` on the package.json file and then use a tool called jq which is a json query language that lets you parse JSON and
get an attr of that JSON object(like `version`).
![img.png](../img/section-4/0039_2-10.png)

With `cat app/package.json | jq -r .version`, we can print out whatever package.json contents are and then use jq to grab the version attr value and that's how we read
a nodejs app version in our pipeline code.

Now in order to use jq, we need to first install it. So on the runner that executes that build_image job which is in our case that ec2 instance runner with shell executor(look
at `tags`), that runner has to have jq tool installed. So go to that gitlab runner and install jq. For this, connect to that server by using ssh with a command similar to this:
`ssh -i <path tp pem file> <username like ubuntu>@<public IP address like 35.180.46.122>`

Then run: `sudo apt-get install jq`.

![img.png](../img/section-4/0039_2-11.png)

To demonstrate how this work, copy the package.json file and run: vim package.json
then paste the copied text, then a `:wq` then **ls** to make sure you have created a file called package.json . Then if you run: `cat package.json | jq` which gonna give you whole 
JSON **object**(really an object!), then run: `cat package.json | jq -r .version`.

Now let's save the result into an env variable named `PACKAGE_JSON_VERSION` by using export keyword. Let's move that initialization of PACKAGE_JSON_VERSION env variable to before_script section
and not the scripts section. Because it's kinda a preparation for whatever main script or main logic(scripts section) we want to execute.

So this is the first step of reading the application version from the package.json , instead of hard coding it in the pipeline and this means the developers who
are developing the app, are the ones who are gonna manage the application version in the package.json and not in the pipeline. So pipeline shouldn't care what the
version of the app is?

### generating unique version tag:
However, now we have a problem that someone needs to manually adjust the version in package.json . So on every commit, on every pipeline execution, the version in package.json
should be updated manually otherwise, we're gonna build the same image tag again! So we're gonna be overwriting the image and have the same problem of not having versioned
images for our app changes. So that's the second part.
![img.png](../img/section-4/0039_2-12.png)
![img.png](../img/section-4/0039_2-13.png)

We want to generate a unique tag for our image on every build. How can we do that?
![img.png](../img/section-4/0039_2-14.png)

As part of our app version which is defined in package.json , we can use values of one of the gitlab's predefined env variables. For example, the CI_PIPELINE_IID will
give us the unique id of the pipeline, either on a project level(so for our project, each pipeline execution will have it's own id) or we can also grab a unique id of the
pipeline across multiple projects that we have in the same gitlab instance. In our case, let's go for a unique pipeline id for the project, because we're building the docker
images for our project, so it has to be unique for that specific project.

It's common when building images in a CI/CD pipeline, generally on any CI/CD platform like jenkins or gitlab. It's very common to append the build number or build id value to the
application version.
![img.png](../img/section-4/0039_2-15.png)

So either append it right in the package.json version's property as some unique build id like: "version": "1.0.0-build-id" or even use it as a replacement or substitute to the
patch version like: "version": "1.0.build-id" . 1.0.build-id represents your build sequence and in our casae our pipeline sequence and this number will be unique for every 
pipeline execution and this will give us a unique image tag with every build.
![img.png](../img/section-4/0039_2-16.png)

Let's combine this and build our images with a dynamically set unique version. 

**In our case, let's go with a $PIPELINE_ID as a substitute to the patch version which means, as a version, we're gonna set major and minor and then 
we're gonna append(using a **dot**) that third number in our pipeline.**

In pipeline, in the next line of before_script of build_image, create a variable for the final version named VERSION.

$CI_PIPELINE_IID is the ci pipeline's ID for the project.

So `$PACKAGE_JSON_VERSION.$CI_PIPELINE_IID` will give us the 3 numbered version schema where the third or patch version will always be unique.

Now by using this approach, whenever devs make app changes and commit those changes, a pipeline will get executed and the patch version will be incremented.
Now if they make any minor or major changes, they can go to package.json , adjust the version there as part of the application code changes and this way they can
increment major or minor versions. So this will still be done manually, however the patch version on every push(pipeline execution(if it does execute!)) will be automatically 
incremented in the pipeline.

Now OFC you can extend the logic to automate incrementing the other 2 numbers as well, but at this point, automating the patch version update should be enough.

### use artifacts in other jobs:
Now we're building the image with a new unique version on every pipeline execution.
![img.png](../img/section-4/0039_2-17.png)

But we also need to push that built image which means we need that $VERSION that we just put together, also in that `push_image` job. But here's the problem:

Since we're setting that VERSION as an env variable for build_image job, the VERSION env variable is only accessible for that same job, for any following jobs,
that will not be accessible. Because as we learned, every single job gets executed on it's own new environment and all the previous config and stuff for the previous 
jobs get discarded. So any environment changes or config set in the previous jobs, will not be avaialble for push_image job(next jobs). 

So how do we access that env variable set in a previous job, in following jobs like push_image or deploy_to_dev?
![img.png](../img/section-4/0039_2-18.png)

One solutions is to create that env variable in each job that needs it. But we don't want to repeat the code.

So how do we share any values that we produce in one job, with the following jobs? 

That's where the concept of artifacts comes in again.
![img.png](../img/section-4/0039_2-19.png)

We learned about artifacts by exporting test reports.

Artifacts is generally used to generate any files or artifacts as a result of a job execution and we can then download these artifacts in the gitlab UI.
![img.png](../img/section-4/0039_2-20.png)

But we can also use artifacts to pass these generated files to the following jobs. 

**So artifacts are used in gtialb CI/CD to pass any intermediate build results between the jobs.**
![img.png](../img/section-4/0039_2-21.png)

So in case of test reports: We generated reports to download them and maybe view them in a respected software.
![img.png](../img/section-4/0039_2-22.png)

But in this case, we can use the artifacts to generate a file that contains the VERSION env variable that other jobs can access it
![img.png](../img/section-4/0039_2-23.png)

To do this, in build_image job, we create a simple text file that contains the value of VERSION env variable after we created(using `export`) that variable.
So whatever $VERSION echos, we're gonna direct it into a file named called `version-file.txt` .

That creates a file in that job, however we have to persist that file, so it's gonna be available for the next jobs.

In order to persist a file, use the `artifacts` attr. So that we can:
1) download it and browse it in the UI
2) can be available for the following jobs(rest of the pipeline)

Now when the build_image job is done, the version-file.txt artifact will be uploaded to the gitlab server and then, it will be downloaded in the execution env of
any following jobs(another_job in pic).
![img.png](../img/section-4/0039_2-24.png)

Now let's see how to use that version-file.txt file in push_image job? Or:

**How do we reference an artifact saved by a previous job?**

We just use it! So let's cat that file and assign the result in an env variable called VERSION in before_script of push_image.

So now we have that version value also available in the push_image job.

How does the version-file.txt artifact become available for other jobs in the pipeline? Do we need to do some extra config to get that file?

By default in gitlab, all the artifacts of the previous jobs, will be automatically downloaded and made available for jobs in the next stages.
This means, if jobs in test stage and build stage produce artifacts, all of these artifacts will be automatically downloaded and made available for all the jobs
in the next stages. 

In our case, the next stage is `deploy` stage. So `deploy_to_dev` job will have these artifacts automatically, we won't need to do anything there.
![img.png](../img/section-4/0039_2-25.png)
![img.png](../img/section-4/0039_2-26.png)
![img.png](../img/section-4/0039_2-27.png)
![img.png](../img/section-4/0039_2-28.png)

However, the `push_image` job is in the same stage as the `build_image` job. They're both in the `build` stage. **So this rule of:
artifacts are automatically downloaded and made available to next stages, does not apply here, because it's in the same stage of those artifacts being generated.**
So what do we do in this case?

Whenever we want to use an artifact from the job in the same stage, we need to use an attribute called `dependencies` on the job to tell gitlab: please download 
artifacts that this other job created and make it available for this job as well. Not just the following stages, but for the jobs in the **same stage** as well.
![img.png](../img/section-4/0039_2-29.png)
![img.png](../img/section-4/0039_2-30.png)

The dependencies attr is a list of jobs from which you need to grab artifacts from.

With this attr, even though push_image is in the same stage as the build_image which is creating the artifacts which are needed in push_image, we will still get
those artifacts and be able to use it in push_image job. So once the build_image job completes, the artifacts will be uploaded to gitlab server and persisted and saved
there to then be downloaded in other jobs(then push_image will be executed and get the artifacts). Gitlab will download all the artifacts in the job execution environment
of push_image and make them available for use.

![img.png](../img/section-4/0039_2-31.png)
![img.png](../img/section-4/0039_2-32.png)

We noticed that we're using both dependencies and needs attrs together and this two seem to have similar meanings. There, we're saying the push_image job needs build_image
job and it depends on build_image. Here's how it works:

`needs` and `dependencies` attrs have different purposes, but they do overlap in their functionality.

The needs attr says: push_image job needs build_image job to complete successfully before push_image job can start. Sp if the build_image job fails, then this should not be
executed, which is logical because we can't push an image that we haven't built.

The main purpose of `dependencies` attr, is to tell gitlab that push_image job needs an artifact from the build_image job and this is only needed if they are in the same
stage.

However, there are overlaps on needs and dependencies attrs and when they're used in combination, they actually affect each other. 

![img.png](../img/section-4/0039_2-33.png)
![img.png](../img/section-4/0039_2-34.png)

One of the overlaps, is that when we use both attrs on a job, gitlab can only download artifacts of the jobs that are listed under `needs`.
So if both are used, we have to include every job that we list in `dependencies`, in `needs` too, in order to download it's artifacts. So in this case, needs will
affect the funcionality of dependencies.
![img.png](../img/section-4/0039_2-35.png)

Another overlap is that when we use needs, it already implies the dependency. Which means in this case:
```yaml
  needs:
    - build_image
  dependencies:
    - build_image
```
gitlab will wait for the build_image job to complete before starting the one which we defined `needs` for it, but it will also download any artifacts from that build_image job and
as a result, **we do not need to use dependencies, when we have needs attr already. Because needs will be implicit dependencies as well.**
![img.png](../img/section-4/0039_2-36.png)

It's important to differentiate the needs and dependencies have different purposes, but when used in combination, they affect each other.

Let's say in next stages, we have several jobs that don't need that artifacts at all. In this case, we can tell gitlab not to download the artifacts from jobs of previous
stages. Because by default those artifacts(like version-file.txt artifact) will automatically get downloaded for the jobs if they are in the next stages, by setting dependencies
to an empty array. This will tell gitlab do not download any artifacts of any jobs of the previous stages. This could be helpful if
you're producing a lot of artifacts in your pipelines and you don't want to waste your bandwidth and time for fetching all of them from internet(gitlab server) for jobs that
don't need those artifacts.
![img.png](../img/section-4/0039_2-37.png)

Or it could be that you job only needs artifacts from one of the previous jobs, so you can specify only that one on the `dependencies` list.

This will make sure that only the artifacts of run_unit_test job will be downloaded and made available for this job and not the others:
![img.png](../img/section-4/0039_2-38.png)

So with `dependencies` attr, you can control which artifacts from previous jobs get downloaded and which don't.

In other jobs after the job which generates artifacts, those artifacts is automatically available like in deploy_to_dev job(that version-file.txt is automatically available).
So we don't need to specify dependencies there, they will be automatically available.

So now, instead of hard coding the version, we're incrementing the version of every pipeline run and we're using that incremented version to build the new image,
to push that image to the repo and to deploy that new image to a development environment.

LEt's push the image and that would trigger the pipeline so that we have a new docker image in our container registry.
![img.png](../img/section-4/0039_2-39.png)

In pic above, `121` corresponds to number of times we have run the pipeline in total. The next time it's run again, that number would be 122.
![img.png](../img/section-4/0039_2-40.png)

If you don't have some of the pipelines deleted in gitlab, that number should be equal to the number in the `All` tab of CI/CD > pipelines page.

With this, we have optimized our pipeline so that instead of manually changing the version, we're incrementing the version automatically with every pipeline execution.
![img.png](../img/section-4/0039_2-41.png)

This way, we're building a history of docker images for each application change. So if we wanna go back to a specific docker version, then we can use that iamge tag to deploy
that specific image.
![img.png](../img/section-4/0039_2-42.png)

### pass env vars as dotenv artifact:
One thing regarding sharing artifacts between the jobs: 

What we learned is a generic way of producing any file with any value and making it available for the next jobs.
But in our case, we're saving and passing an env variable named VERSION which we read out from version-file.txt and export it as an env variable and for this 
specific case, gitlab has a dedicated feature to pass env variables between the jobs. 

![img.png](../img/section-4/0039_2-43.png)

For this, instead of saving the env variable file into a .txt file, we need to save it into a file with .env extension. So rename it to build.env .
![img.png](../img/section-4/0039_2-44.png)

and we need to save the env variable **key-value pairs**(it has to have a specific format).
![img.png](../img/section-4/0039_2-45.png)

You can set multiple env variables inside that .env file by repeating this line multiple times:
`echo "<key>=<value>" >> version-file.env`
We used `>>` instead of `>` to append the contents instead of overwriting.

That's how we save **env** variables into .env files.

Now in artifacts, instead of `paths` attr, use `reports` attr and `dotenv` inside `reports` and put the env files we're saving.

![img.png](../img/section-4/0039_2-46.png)
![img.png](../img/section-4/0039_2-47.png)

Now in the jobs where we need that value, that env variable that we're saving to a .env file(which that env variable in our case is named VERSION), will be
automatically available as an env variable. So gitlab will do `export VERSION=...` for you, which means you don't have to do that for example in before_script of
`push_imge`. So let's comment that `export VERSION=$(cat version-file.txt)` line in `push_image` and `deploy_to_dev`. So reading it from the file and then set it to an env variable and
export it, is not needed anymore.

Now same rules apply when it comes to using dependencies and needs attrs.

For the jobs in the next stages, those env variables will be automatically set, for the jobs in the **same** stage, you need to either have the `needs` or `dependencies` attr
and again, the same way you can decide **not** to inherit those env variables(let's say you have job where it has it's own env variables with the same name as the
env variables(or generic artifacts) that are made available before by previous jobs) by setting `dependencies` to `[]`, which tells gitlab: Do not inherit or set any artifacts
from the previous jobs.
![img.png](../img/section-4/0039_2-48.png)

By using a .env file instead of version-file.txt, there is no need to download any artifacts because they are env variables that get set in that job execution environment.
So we don't see logs about artifacts being downloaded.

So using .env files instead of .txt files for passing env variables is a bit more better, in our case, it doesn't really matter because we have just one env variable, but if we had
other env variables that we wanted to pass to multiple other jobs, that .env file approach is better, because it will be hard to read 5 different env variable values from
a .txt file. But with .env feature, you don't have to read those .env files, gitlab sets them automatically by default.
![img.png](../img/section-4/0039_2-49.png)

In our case, let's stick to generic approach of passing values(like env variables) between the jobs, just to learn the concept of how do it for any file and any value(not just
env variables).


## 0040_3_Configure_Caching_to_speed_up_Pipeline_execution
### caching in gitlab CI/CD - speed up the pipeline:
### why caching?
This is sth you always need in your CI/CD configuration, which is caching.
![img.png](../img/section-4/0040_3-1.png)

Each job runs in it's own isolated env independently from other jobs. So everything we configure for one job like setting env variables, creating
any files and ..., will not be available for the following jobs. They will start from a fresh env and that's great because jobs don't affect each other
and you have no unexpected side effects.

![img.png](../img/section-4/0040_3-2.png)

However there are some cases where **you need to share some files between the jobs**.

![img.png](../img/section-4/0040_3-3.png)

Earlier we learned about a concept called artifacts. Which we used for 2 things:
1) to save files generated by a job to make it available after the pipeline has completed. So you can download them from gitlab UI, like test reports,
security scan reports, code analysis reports and ... . So every such job can generate it's own reports.
![img.png](../img/section-4/0040_3-4.png)
2) In addition to having those artifacts available for download, we can also use them to save files that other jobs will need. So artifact is generated during the
pipeline in one job and made available to the following jobs. So it's usage is to share files **within the pipeline**.
![img.png](../img/section-4/0040_3-5.png)
But let's consider the following use case:
Let's say we have a job that runs npm install.
Another job after the one that has npm install, for example runs code analysis and it also first needs to install the deps. So we would have to do
`npm install` again for that job. But since the job will run in it's own new environment, it would have to fetch it's own dependencies in the node_modules itself and
it can't reuse the node_modules installed by a previous job.
![img.png](../img/section-4/0040_3-6.png)
![img.png](../img/section-4/0040_3-7.png)

So multiple jobs are installing the same exact deps because they can't reuse the deps from the previous job.
![img.png](../img/section-4/0040_3-8.png)
![img.png](../img/section-4/0040_3-9.png)
![img.png](../img/section-4/0040_3-10.png)

When one job installs the deps and creates the node_modules folder, we need a way to share this folder with others, so they don't have to go through the same process
and at first, this may sound like a use case for artifacts:  sharing files or folders between the jobs. However, what we also need, is that the next time the pipeline runs,
we want to reuse the node-modules **from the previous pipeline run**. Plus, with artifacts we know that the files that job generates, will get uploaded to gitlab server which is
another machine and then they will get downloaded again on the gitlab runner for the next job and it is obviously fine for 1 or 2 files, but in node_modules we have a lot of files
and folders, so uploading them to gitlab server and downloading them each time, will not be a big optimization. You still will need a lot of 
time and bandwidth to fetch them.
![img.png](../img/section-4/0040_3-11.png)
![img.png](../img/section-4/0040_3-12.png)

Also consider that once you have the first ready version of your app, you're not gonna change the deps very often. So that list of deps as well as the node_modules folder
will stay the same for long periods of time.

So if your team pushes changes a lot during a day, this will trigger a lot of pipeline executions which will do unnecessary fetching of deps for every job and if we could
reuse the deps, that will speed up your pipeline executions and save you a lot of bandwidth and that's exactly the gitlab CI feature of caching allows us to do.
![img.png](../img/section-4/0040_3-13.png)

### artifacts vs caching:
Artifacts get uploaded and saved in gitlab server and made available for following jobs and it's used to pass artifacts to the following jobs.
Cache on the other side, is used to store runtime deps that the project needs and it's passed between the jobs in any direction and unlike artifacts, cache is not stored on the
gitlab server but rather is stored on the gitlab **runner**(so on the server where gitlab **runner** is installed) and this means when your jobs run on the **same** runner,
they can reuse the cache directly locally from that runner's host machine, so they don't need to fetch anything from the internet.
![img.png](../img/section-4/0040_3-14.png)
![img.png](../img/section-4/0040_3-15.png)

### distributed cache:
And when you have 1 or 2 runners for your project's pipelines, this makes total sense because the jobs will always get executed on these two runners which already have the
cache, however, if you have 100 runners and jobs get **randomly** assigned to them, then caching may not be efficient because you would need to create cache on each
runner's server. 

So when one job runs and creates this cache for node_modules on one gitlab runner server, the next job may get executed on **another** machine which doesn't have
the cache yet. So it will have to generate the cache again, so this kinda defeats the purpose of storing the cache on the runner's server.

![img.png](../img/section-4/0040_3-16.png)
![img.png](../img/section-4/0040_3-17.png)
![img.png](../img/section-4/0040_3-18.png)
![img.png](../img/section-4/0040_3-19.png)

For this use case(a lot of runners), you could also configure what's called a distributed cache storage, like s3 bucket from where they will fetch the cache. So you can have
a central cache storage for all your jobs no matter on which runner they get executed. A downside of this is that you need again to download that from remote storage(fetch that
from internet), but it's still more efficient and faster to download a ZIP file of node_modules and unzip it, than install deps from scratch.
![img.png](../img/section-4/0040_3-20.png)
![img.png](../img/section-4/0040_3-21.png)
![img.png](../img/section-4/0040_3-22.png)

### configure cache for the pipeline:
Now that we know what cache is and how it's different from the artifacts and that it's used to store runtime deps, let's see how to configure a cache?
Just like artifacts, you can define cache configuration for each job. 

![img.png](../img/section-4/0040_3-23.png)

For example in `run_unit_tests` job, we can add cache attr which will generate the cache for node_modules folder by the config I'm gonna say, that the following jobs can reuse.
So while it generates the artifacts for the test reports, it will also generate the cache for node_modules that the following jobs can reuse and there are 2 things that we need to
configure for a cache:
1) name of the cache or the cache key which is a string and it's useful because it will ensure that you're fetching the right file(right cache) for the job, because
you can have multiple caches and OFC you need to make sure you're using the right one for the other jobs

A common use case for naming the keys of the cache is when you have multiple branches and you're running pipelines for all those branches, you can use the branch name as
the cache key. So this way, whenever the pipeline gets executed for main branch, then all the jobs that run for the specific branch, will use the same cache and not a cache
from another branch and again: we want to dynamically set the name of the branch and not hard code it and for that, we also have a predefined env variable which is
$CI_COMMIT_REF_NAME which represents the branch or tag name for which the project is built or basically which triggered the pipeline.

![img.png](../img/section-4/0040_3-24.png)
![img.png](../img/section-4/0040_3-25.png)
![img.png](../img/section-4/0040_3-26.png)

2) location of the cache(where are we saving the cache and where are we accessing the cache) which is specified using the paths attr.
Since the node_modules folder is inside the app directory, we're gonna specify: app/node_modules.

In that job we need node_modules cache to be available because we have an npm install there.

![img.png](../img/section-4/0040_3-27.png)

In `run_unit_tests` job, cache will have 2 different purposes.
1) To generate the cache, so that any other jobs that also need that node_modules cache available, they can use it
2) download the cache. The very first time we run the pipeline with this cache config, the run_unit_test job will generate the cache and the second time the pipeline runs,
the same run_unit_test job can reuse it's own cache that it generated in the previous pipelien run. So the second usage of this cache in the job, will be to
download that cache and use it for itself

![img.png](../img/section-4/0040_3-28.png)
![img.png](../img/section-4/0040_3-29.png)

This is what called a pull-push policy. There's an additional attr for the cache attr, called policy and the pull=push policy means that that job will download
the cache at the beginning of the execution and at the end, when the job is complete, it will upload any changes to the cache. The pull-push value is the default
value for policy, so we don't have to specify it. So we can just skip the specifying of `policy: pull-push`.
![img.png](../img/section-4/0040_3-30.png)

For demonstration, let's add a job for linting and it will run on the same runner and it also needs to install the deps which are stored in node_modules.

Linting is an automatic way of going through your source code and checking it for any programmatic or stylistic errors.

This job is gonna run on the same runner with docker executor and in it's before_script, we need to do npm install because we're using some lint tool in our project 
that is a third party module(we have the lint tool dep specified in package.json). So we need an `npm install` or `npm ci`.
![img.png](../img/section-4/0040_3-31.png)

Note that because `run_lint_checks` and `run_unit_tests` jobs are in the same stage, these two jobs will run in parallel. So we don't know which one will
complete first and since we're also installing the deps, we can use the same cache config from `run_unit_tests` in `run_lint_checks`. So we're referencing the same
cache in both jobs.

For any job, if you don't specify the policy of the cache, by default, it is gonna download the cache when it starts, executing the job and when it finishes,
it will upload the cache.

The problem is though, when we have multiple jobs running in `parallel`(they are in the same stage for example) that are using the same cache and then
uploading or updating the same cache after they finished, we may get problems because that is a storage with some data and then multiple different processes
updating the data at the same time, may lead to problems. So what we can do, is we can make one of them(one of the cache configs), readonly. For this, set a policy
on one of the jobs like run_lint_checks that says: "You're allowed to only pull the cache. So do not update or upload anything to the cache storage when that job is done. Only
download it and use it if it's available". For this, use pull policy in `run_lint_checks` job to avoid any issues when updating the cache

![img.png](../img/section-4/0040_3-32.png)
![img.png](../img/section-4/0040_3-33.png)

In many projects, people have a dedicated job for just creating(generating) the cache and this job will be called setup_cache or build_cache and the only purpose of
that job will be to build cache and it's policy will be `push` because it's not gonna need to read the cache, it is only there to generate and then update it:
![img.png](../img/section-4/0040_3-34.png)
```yaml
build_cache:
  cache:
    key: "$CI_COMMIT_REF_NAME"
    paths: 
      - app/node_modules
    policy: push
```

So when you have dedicated job for building and managing the cache, you can set the cache policy to pull on every other job and you don't have the problem as well.

Note: Even though we're using cache attr in jobs, we still need to do the npm install if the job needs it. After the first pipeline run, we can expect the cache to be there
and be available for the job but we still need to do npm install and this is one of the best practices of using cache in general in gitlab CI/CD is: your
job should never depend on the cache being available.

![img.png](../img/section-4/0040_3-35.png)

So even if the cache is empty or just got invalidated or sth happened to the cache and you don't have access to it, your job should still be able to run successfully without
depending or needing the cache. The cache is kinda optional nice to have to speed up the job and optimize the pipeline but it shouldn't be a reason that your job breaks 
if the cache is not there.

![img.png](../img/section-4/0040_3-36.png)

### configure volume for docker executor:
The config for cache is ready, however we have one problem and it is that our jobs that are using the cache, are being executed on a gitlab runner with docker executor, which means
when the job starts, a docker container gets created and the job gets executed inside that docker container and this actually means that the cache will be created inside
the directory of the docker container. Remember that we said that the cache is stored locally on the execution environment of the job? In this case, this is gonna be the
filesystem of the **container** and what happens is when the job gets completed, the gitlab runner will remove the docker container and while artifacts get
uploaded to the gitlab server, so they're persisted on another machine, cache gets stored on the local filesystem and since containers are ephemeral, meaning whatever
you create inside the docker container's filesystem, by default also gets deleted, so containers do not persist any files or any data when they get removed.
![img.png](../img/section-4/0040_3-37.png)
![img.png](../img/section-4/0040_3-38.png)

So those files do not get stored on the host where the container is running, but in order to make that happen, we need to configure volumes.

![img.png](../img/section-4/0040_3-39.png)
![img.png](../img/section-4/0040_3-40.png)

So our goal with the cache is, we want to persist or save that cache data on the machine(server) where the jobs are running.
For this, we need to configure a volume for our gitlab runner that uses the docker executor. For this, in runner's filesystem(you can access the runner's filesystem by
SSHing into that runner) and go to /etc/gitlab-runner by using `sudo` and inside that we have config.toml and that's the file that we can set different configs
for our runners and you can open that file using **vim**.

![img.png](../img/section-4/0040_3-41.png)

In runners section, add an attr called `cache_dir` and set it to /cache and that's the same location that is persisted using the volumes attr:
![img.png](../img/section-4/0040_3-42.png)

![img.png](../img/section-4/0040_3-43.png)
So we're saving a volume of /cache from the container and we're using it as a cache directory. So we have configured our docker executor to persist the cache directory
on the host. So on the next job execution, the cache generated by the previous container should be available again.

Save that file using `:wq`.

Now we can execute the pipeline by triggering it(pushing changes). 

Note: To commit changes, go to the root directory pf your project(actually where .git exists) and then run git commands.

### pipeline execution:
For the first time or when there is not a cache, the packages should be downloaded from internet and when the job is finished, the job will create or generate the
cache with the specified cache key:
![img.png](../img/section-4/0040_3-44.png)

In the next jobs, we will have log for checking the cache:
![img.png](../img/section-4/0040_3-45.png)

if the cache is available, there is no download for npm install and the log for that npm install command would be like:
![img.png](../img/section-4/0040_3-46.png)
which means node_modules is already there, no need to download anything which is what we want.

If there is the pull policy for cache set, the log would be:
![img.png](../img/section-4/0040_3-47.png)
Which means it's only reading the cache and is not uploading any changes to it.
![img.png](../img/section-4/0040_3-48.png)

### clearing the cache:
Remove the run_lint_checks job(it was just for demonstration).

Whenever you want to get rid of cache, in pipelines page, there's a button named `Clear runner caches` which will clear the cache on your gitlab runners,
so when we run the pipeline again, new cache will be generated.
![img.png](../img/section-4/0040_3-49.png)

Note that the old cache will not be deleted when we click on `Clear runner caches` button. It will simply not be used anymore in the pipeline, but they still remain
physically located on the gitlab runner.

So if you actually want to delete that cache and maybe free-up some space on your gitlab runners, you would have to locate the cache and manually remove it from there.
![img.png](../img/section-4/0040_3-50.png)

So that `Clear runner caches` button is to tell gitlab to not to use the old cache(s) that we generated with that pipeline and generate new ones.

Now if you run the pipeline again, you see the cache keys indexes changes, for example from main-3 to main-4 (main is the name of the branch).
So whenever we clear the cache, the cache doesn't actually get deleted, it is the old cache that's temporraily saved and you get a new cache with an incremented index
at the end.

### where the caches are stored:
Where that cache is physically located? 

We know that is saved on the gitlab runner machine and since we're using the docker executor, we're persisting that using a docker volume. Which means the physical
storage is actually managed by docker.
If you do `docker volume ls`, you can see references to the physical location(not the actual location, but the volume names) on that ec2 instance(we presume you have SSHed into that 
machine).

Now to get the actual physical location of caches, do: `docker volume inspect <volume name selected from previous command>`. Now look at `Mountpoint` which has a format of:
`/var/lib/docker/volumes/<name of the volume>/_data` and for checking the contents of the directory, run: `sudo ls /var/lib/docker/volumes/<name of the volume>/_data`, you
would see a folder with a name of your gitlab user and now run the previous command with this folder appended at the end, which again you see a folder named with
project name, again go into that by appending the name of that folder to `ls` command I mentioned. There, you have multiple folders with the names(keys) of the caches.

So even though we cleared the cache, they didn't actually deleted, instead they're not used for the jobs anymore. 

If you look inside one of the cache directories by using `ls` with `sudo`, there is a cache.zip which is where the cache is physically stored when using the docker executor.

![img.png](../img/section-4/0040_3-51.png)
![img.png](../img/section-4/0040_3-52.png)

If we were using a shell executor instead of docker executor, then the location of the cache would be different and gitlab has docs for these which those docs are
in `Cache and artifacts` page:

![img.png](../img/section-4/0040_3-53.png)


## 0041_4_Testing_in_CI_CD_Configure_Security_Tests_SAST
### Testing in CI/CD - add SAST job:
We have learned and applied these in our pipeline:
![img.png](../img/section-4/0041_4-1.png)

Now, we're gonna configure another step in our pipeline, for testing the application code for security issues. It's called SAST or static application security testing:
![img.png](../img/section-4/0041_4-2.png)

and we will configure this thing while learning another concept in gitlab that is called `job templates`, where in your pipeline, you include jobs that
gitlab already has available for you.
![img.png](../img/section-4/0041_4-3.png)

Let's see what is auto devops?

### testing in CI/CD:
Currently, in our pipeline we're running unit tests. But when it comes to delivering and releasing application changes, OFC in real life scnearios, we want to do
much more extensive testing. Because you don't want to release changes that will potentially break logic or performance of the app or introduce some security issues.   

So when you develop and add a new feature that you eager to deliver to your end users, you have tradeoff of wanting to relase it as fast as possible, but also
taking time to test extensively. So it doesn't break your entire app and for that, we have many different types of testing and this can be automated test or 
manual test as well, but ideally, we want to have enough automated test that there is no need for manual testing anymore

![img.png](../img/section-4/0041_4-4.png)
![img.png](../img/section-4/0041_4-5.png)
![img.png](../img/section-4/0041_4-6.png)

With unit tests, we can for example test that our functions are written correctly and they're giving the correct output.
![img.png](../img/section-4/0041_4-7.png)

![img.png](../img/section-4/0041_4-8.png)

Integration testing is used to validate the interaction between different parts of the app.

![img.png](../img/section-4/0041_4-9.png)

Developers and test engineers usually create test scenarios and write tests for them and when we release the app changes, all these types of test can be run
to test different aspects of the app.

![img.png](../img/section-4/0041_4-10.png)

The tests that we mentioned, are all application logic or functionality-related tests. We also have tests or we want to have tests that validate
application security, like searching for any security issues or vulnerabilities and ... . One of such tests is what's called **SAST** and this is what
we're gonna add to our pipeline.
![img.png](../img/section-4/0041_4-11.png)

What SAST does is review the app source code to identify any vulnerabilities that can make an app susceptible to an attack and you can see a list
of such vulnerabilities that you want to validate and check in your app code.

![img.png](../img/section-4/0041_4-12.png)

DAST is a testing method that examines an app's security dynamically as the app is running, in order to find vulnerabilities that an attacker could exploit.

![img.png](../img/section-4/0041_4-13.png)

**Important:** When to run which types of tests in the pipeline?

For example the integration tests require a deployed running app, so that you can test it with other services that it integrates with. Which means we can **only** run them once
we have deployed the new application image to development or staging environment.

On the other hand, we can run unit tests, early in the pipeline everytime we commit new changes.

The same way, SAST test should also be performed early and often against your application source code. While DAST should be performed on a running application
in an environment which is very similar to production.

![img.png](../img/section-4/0041_4-14.png)

Now you should have a good understanding of the big picture of CI/CD pipeline and different types of tests that you can run in the pipeline.
We're not gonna go into details on how to write these tests or explain each type of test and when to run them. Instead, we're gonna focus on running SAST tests
in our pipeline, in order to showcase a functionality of gitlab that allows you to use existing gitlab jobs with everything already configured in it, to include and run it
in your own application pipeline. This means, we don't even need to know how to write or execute SAST tests, we simply use the SAST job that gitlab makes available
for it's users.
![img.png](../img/section-4/0041_4-15.png)

### tempalte for SAST:
Gitlab provides readily available templates for jobs for different programming langs and techs and one of these job tempalates is for running static application
security tests.

We will use one of the templates and add a job in our pipeline that will run SAST on our nodejs app. We're getting this funcitonality out of the box with little
configuration effort on our side.

![img.png](../img/section-4/0041_4-16.png)

### gitlab job templates:
What is a template in gitlab CI/CD?
Templates are like already created gitlab jobs.
![img.png](../img/section-4/0041_4-17.png)

Template jobs, compared to regular jobs, are generic, so that they can be reused for multiple projects with any programming language or tech stack and
as the name suggests, you can pass parameters to the template jobs to customize their behavior to your own needs.

![img.png](../img/section-4/0041_4-18.png)

So gitlab engineers wrote a bunch of job templates for different langs and techs and you can reuse them without writing your own job configuration.

![img.png](../img/section-4/0041_4-19.png)

In repository of gitlab([link](https://gitlab.com/gitlab-org/gitlab/-/tree/master/lib/gitlab/ci/templates)) contains a list of all these templates.
For example let's go to Security folder which contains templates for different security tests, like container scanning, image scanning and ... .

![img.png](../img/section-4/0041_4-20.png)

### include SAST template:
How do we reference that whole job template within our own pipeline code?

For adding any gitlab job templates in our own pipeline, we have `include` attr and whenever we want to include a job template of gitlab itself,
we specify `tempalte` attr and then the location of that gitlab job template and when we specify a `template` attr there, gitlab knows we wanna include a job
template from gitlab itself from that `Gitlab.org` repo and that's why we don't have to specify the whole address there, we only have to specify the path
**within** that repo which in this case is gonna be `Jobs` folder and inside that, the `SAST.gitlab-ci.yml` file.

![img.png](../img/section-4/0041_4-21.png)
 
With `template: Jobs/SAST.gitlab-ci.yml` syntax, it tells to gitlab that we want to extend our own pipeline with some of the logic that gitlab provides us with,
in this specific file.

So it's like we're merging two pipeline codes in one.

When we include ci config files with template attr in our pipeline, gitlab is smart enough to detect what lang or tech we're using and it's gonna pick the right job
from the entire list of SAST.gitlab-ci.yml and only run that one(we don't need other jobs for other langs and techs) and in order to trigger the jobs
that we're including in our ci config using `include`, we can for example say:
```yaml
sast: 
  stage
```
The above code will trigger the SAST jobs that are made available in our pipeline using template: `Jobs/SAST.gitlab-ci.yml` reference.

Now when you run the pipeline, in test stage, in addition to `run_unit_test`, we have 3 additional jobs that were added from that `SAST.gitlab-ci.yml` file.

![img.png](../img/section-4/0041_4-22.png)

**eslint-sast** job:
![img.png](../img/section-4/0041_4-23.png)

Those SAST test generated the reports for all the included 3 jobs, so if you have a software or app that your team uses to visualize the SAST job reports,
you can download those files, import those test reports into the software for visualization for code analysis.
![img.png](../img/section-4/0041_4-24.png)

### pipeline templates:
Besides the job templates that gitlab makes available for us, we have a second type of templates which are called pipeline templates which are configurations of the
whole pipeline that you can take and use directly from gitlab. So instead of writing .gitlab-ci.yaml file from scratch, you can take one of the gitlab's pipeline
templates for your specific tech stack.

To do this, if you have a project that doesn't have a pipeline yet, go to CI/CD>pipelines page, you can see a list of pipeline templates.
![img.png](../img/section-4/0041_4-25.png)

## 0042_5_Intro_to_Multi_Stage_Deployments_Multi_Stage_Demo_Part_1
### multi-stage demo-1 - intro & overview:
#### CD - promote to staging & production:
Our current pipeline configs:
![img.png](../img/section-4/0042_5-1.png)

Now we need to add **deploying to the production environment**. Right now we're deploying to the development server and that's the end of the
pipeline, but in real life, you usually have 3 deployment environments.
![img.png](../img/section-4/0042_5-2.png)

Before you rollout a new feature to the end users or any app changes to the end users, you need to make sure those changes didn't break the existing logic
or didn't introduce any security issues, so you release your application changes in stages.

First stage is deploying to the development environment and on this stage, you may run functional and integration tests and SAST tests to make sure the app is still functioning
properly and if those tests are successful, you move the changes(promote the changes) to the next stage which is called either staging or pre-production env and there,
you may want to run performance tests(it didn't get slower because of changes) and you may also run DAST tests and if those tests are successful(they successfully
validate the changes, didn't slow down the app, there are no security issues and ...), you can promote those changes to production stage.
![img.png](../img/section-4/0042_5-3.png)
![img.png](../img/section-4/0042_5-4.png)

And the concept of CI/CD means that the application changes will go through all these stages using the automated pipeline that orchestrates all these steps.
![img.png](../img/section-4/0042_5-5.png)

### deployment envionrments:
![img.png](../img/section-4/0042_5-6.png)

We First, just like we created a development server to deploy to it, we need staging and production servers or environments to deploy to and for this,
we can create 2 additional EC2 instances which would be how you do it in real life(exactly as we created the dev server).
![img.png](../img/section-4/0042_5-7.png)

In our case, in order to save infra cost and the effort of managing of these 3 different machines,  we're gonna reuse the dev server for all 3 envs and
we're gonna deploy the app on all 3 stages there, but on different ports. So the app will run in parallel on 3 different ports and these ports will basically simulate
a different env.

This way we can simulate these 2 additional envs on the **same server**.

![img.png](../img/section-4/0042_5-8.png)
![img.png](../img/section-4/0042_5-9.png)

### make host port configurable:
The port of host gonna be different for each env, but the container's port(app's port) is always 3000. In docker-compose file's port attr,
when we have 3001:3000 , the host's port is 3001 and container's port is 3000(we're binding the container port on the host port) and we're gonna make
the host port, configurable. So all the containers for different envs, will start at port 3000, but on the host, they will be exposed on different ports.
![img.png](../img/section-4/0042_5-10.png)

Let's parameterize the container's port in docker-compose file and create a variable called `DC_APP_PORT` for it which we're gonna set in the pipeline.

Now in deploy_to_dev job, set the `DC_APP_PORT`(docker compose app port) env variable using `export` and in development env, set it to 3000.



## 0043_6_Promote_to_Staging_Multi_Stage_Demo_Part_2
### multi-stage demo-2 - deploy to staging:
Now copy the whole configuration for deploy_to_dev job.

deploy_to_staging job will take the private key of the deployment server, it will grab the version from the artifact from the build_image job, it will
connect to the server, copy the docker-compose.yaml there and it will start the container using the docker-compose file, but this time, instead of port 3000,
it will use port 4000 of host.
![img.png](../img/section-4/0043_6-1.png)

The image name and version will be the same, because we're taking the same image and promoting it to the staging:
![img.png](../img/section-4/0043_6-2.png)

In a realistic scenario, we would have a separate dedicated server(machine) for the staging env with it's own private key, hostname and endpoint.
So let's simulate these, even though in this case, they are the same, by creating new variables like STAGING_SERVER_HOST which is gonna be the same
as DEV_SERVER_HOST(because we use the same machine for both development and staging envs) and STAGING_ENDPOINT which it's value in our case is
http://ec2-35-180-46-122.eu-west-3.compute.amaaonaws.com:4000 (port is different because they're on the same machine so we have to choose a different port
than 3000).

We're gonna separate these deployments into different stages, because OFC we **first** want to deploy to the development server, then we're gonna run some tests
there, when these were successful, **then** we're gonna execute another stage for deploy to staging.

![img.png](../img/section-4/0043_6-3.png)

So let's rename the 2 `deploy` stages to `deploy_to_dev` and `deploy_staging` and you have to name them in `stages` attr too.

Between the `deploy_to_dev` and deploy_staging `stages`, let's simulate a stage for running functional tests on a development environment. We can call that
stage `functional_test` or `test_dev`. This stage will get executed after `deploy_to_dev` is **complete** or we can also run it in the `deploy_dev` stage and not a 
separate stage and just make it **wait** for the `deploy_to_dev` job to **complete** before it runs using the `needs` attr.

So you have different possibilities to do that. Let's go with the second one, so remove the test_dev stage from stages attr. 

Now create a new job named `run_functional_tests`.

We can execute `run_functional_tests` job on our own runner or on gitlab shared runner, it doesn't matter which one.

With this configuration, first we're deploying to development, setting the port of the app to 3000, then we're running functional tests after deploy_to_dev
completed and if that was successful, then deploy_to_staging job gets executed and it deploys to staging env on port 4000.
![img.png](../img/section-4/0043_6-4.png)

### configure custom container names:
There is one more thing that we need to configure, so that we can reuse the same docker-compose file on the same server to start multiple containers.
Right now when deploy_to_dev completes and deploys the app to development env, the container using docker-compose file will create the service called
`app`(how did you tell that? Because in services attr of docker-compose, we have `app`) and will start the container.

Then deploy_to_staging will start and before we start the containers, we have a docker-compose down, in order to stop all the previous containers and this job
will go through the **same** docker-compose file and it will see: Ok, I have a service called `app` and I'm gonna stop that and it will stop the container that
deploy_to_dev job started and we're gonna fix this.

Whenever we start a container using docker-compose file, the name of the container gets composed with 3 different parts. In the image below, the
name of the docker container is: ubuntu_app_1(look at the NAME column). How this name got created?

<name of the current folder that we're in>_<name of the service>_<suffix that docker-compose appends>

That name above is the default behavior of docker-compose.

![img.png](../img/section-4/0043_6-5.png)

So the container name will end up being: `<current directory>_<service name>_<index>`

![img.png](../img/section-4/0043_6-6.png)

We're gonna change the name of the container by overriding that `current directory value` and making it either `dev`, `staging` or `prod`, so that the
container created with the **same** docker-compose file will have a **different** name depending on which job deployed it.

For this, we have an env variable from docker-compose that is called `COMPOSE_PROJECT_NAME` which will overwrite the prefix of the container name
and we're gonna set this env variable value in each of our deployment jobs by using `export` keyword.

Now using the same docker-compose file, we can create containers with different names. This means that docker-compose down command in the staging
job, will look for a container called staging_app_1 and stop only those containers and it will not mess with containers started from `deploy_to_dev` job.
So we have a separation.

Why we did this? Because we want to have the containers from both environments to be running at the same time, so we shouldn't take down the previous
running containers in `deploy_to_staging` job.

![img.png](../img/section-4/0043_6-7.png)

### Run pipeline & access applications:
Let's make a change in our app to see the change deployed on both stages.

But the pipeline failed, why?

Because we didn't stop the currently running container(which for example is called ubuntu_app_1) and since we have changed the name, it troed to
create a new container with a new name like dev_app_1(for dev env because it has `dev` word in it) on the **same port** and it failed.

So we need to stop the currently running container using `docker stop`.

Now execute the whole pipeline again using Run pipeline button.

To check that the new container is running correctly, use `docker ps` :
![img.png](../img/section-4/0043_6-8.png)

In aws panel, let's rename the dev-server to deploy-server, because we're reusing it for both dev and staging, then grab the public DNS(public IPV4 DNS) on port 3000 and
check the app on development env.

The port 4000 of our server is not gonna be accessible yet because we need to open that port in our server. For this, go to security tab of `instances` page, click
on security groups> edit inbound rules and add a new rule and add port 4000 and 0.0.0.0/0 and also let's add port 5000 and the same IP(0.0.0.0/0) for production env

Now we can check the app on port 3000 on dev env, port 4000 for staging env and port 5000 for production env.

### fail functional tests to skip promoting to staging:
Let's simulate that run_functional_tests job fail. So we deploy to development env, then after that deploy_to_dev was successful, the run_functional_tests will run,
but if that fails, this will abort the pipeline and prevent it from promoting the changes to the next stage which is staging.

So if in scripts attr of run_functional_tests, there was an error, the changes are not promoted to staging env.

To check this, run the pipeline with latest changes by pushing code to repo

![img.png](../img/section-4/0043_6-9.png)
![img.png](../img/section-4/0043_6-10.png)
![img.png](../img/section-4/0043_6-11.png)


## 0044_7_Reuse_pipeline_configuration_using_extends_Multi_Stage_Demo_Part_3
### multi-stage demo -3 - use extends to reuse code:
We want to add deploy_to_production, but before we add this step(job), let's do one optimization to our pipeline code.

Currently deploy_to_dev and deploy_to_staging jobs have almost identical logic.

Q: How do we reuse the code inside gitlab CI/CD configuration?
For that, we can use `extends` and create a generic base job and let's call this new job, `deploy`.
![img.png](../img/section-4/0044_7-1.png)
![img.png](../img/section-4/0044_7-2.png)

For making that deploy job generic, first remove the stage attr from there, because it should be defined by specific jobs that use that base job.

Whenever we extend the generic job, we would need to pass those values for the specific deployment job and we do that using env variables.
For example in deploy job, $SSH_PRIVATE_KEY will be different for each deployment, the other env variables defined in that deploy job would be different.

So let's define them as variables in that job, using variables `attr`.

Remember the env variables in deploy job that have a prefix of `DEV_`, because they're not only for development environment anymore. That variables attr indicate the
variables that should set from outside and by default they're set to an empty string.

We have 5 parameters that should be set from outside to make that generic job into specific job(deployment job in this case). Right now everything is parametrized.
![img.png](../img/section-4/0044_7-3.png)

Everything in the base job will be inherited by whichever job extends it.

Now set those values that are expected in deploy_to_dev and deploy_to_staging jobs, using variables attr.

Since we're deploying to the same machine, the SSH_PRIVATE_KEY gonna be the same for both development and staging envs.

![img.png](../img/section-4/0044_7-4.png)

We don't want that base job that we used it for extending in specific jobs, to get executed as an additional separate job in our pipeline.
So how do we prevent that job from being executed?
We make it inactive by making them hidden and to do this, add a **dot(.)** before the job.

![img.png](../img/section-4/0044_7-5.png)
![img.png](../img/section-4/0044_7-6.png)

When gitlab sees there is a job that starts with **dot** in the name, it knows that is a job that is supposed to be extended and it's not supposed to be
executed separately.

Note that in the value for `extends` and other places where the name of hidden job is used, you need to include the **dot** too. That will prevent the 
deploy job to be executed as a separate job.

## 0045_8_Promote_to_Production_Multi_Stage_Demo_Part_4
### multi-stage demo 4 - deploy to PROD:
Let's add deploy to production job named `deploy_to_production`.

Create a new entry as stage in `stages` attr named `deploy_prod`.

Let's simulate running performance tests after we deployed to staging. So create a new job after deploy_to_staging named `run_performance_tests` which will
run in `deploy_staging` stage and it will have a dependency on `deploy_to_staging` job(because both are in the same stage but we want to run `run_performance_tests` job
after `deploy_staging`).

So run_performance_tests job should only after we have deployed to staging successfully, because theoretically, that test will run on the stage env or against the
application version on the staging env. That's why it makes sense to wait for the deployment to staging job before we execute the perf tests.
![img.png](../img/section-4/0045_8-1.png)

If the performance tests are not successful, we don't want to deploy to prod:
![img.png](../img/section-4/0045_8-2.png)
but if they were successful, we can deploy to prod:
![img.png](../img/section-4/0045_8-3.png)

The `http://ec2-35-180-46-122.eu-west-3.compute.amaaonaws.com` url will gonna be different in real life(because we would have multiple EC2 instances each for
specific env), so we didn't extract that value into another variable, again because in real life those values will be different for each env.

Now we have 3 deployment job that all extend from the base deploy job, so that we don't repeat the same code over and over again.

### configure manual approval:
There is one thing we want to add to **production** deployment that we don't have on the other two deployment jobs.

Usually in real life projects, **even** after extensive testing, many teams do not feel comfortable deploying to the production **automatically** without any
manual human review before the deployment.
![img.png](../img/section-4/0045_8-4.png)

Usually, the pipeline will go all the way to staging and run the tests, but it won't deploy to production automatically, instead, it will wait for a human user input like
just clicking a button and we can configure that in gitlab using an attr called `when` and `manual` as value.
when: manually tells gitlab: Do not execute this job immediately. Wait for a user input. So that job is supposed to be executed with a manual approval.
![img.png](../img/section-4/0045_8-5.png)
![img.png](../img/section-4/0045_8-6.png)

### workaround for gitlab bug:
We have one issue with this config and that is specific to a variable of file type.

Remember that we created that SSH_PRIVATE_KEY variable as a file type variable:
![img.png](../img/section-4/0045_8-7.png)
and you also remember when we echo that variable, that gives us a path to a temporary file which has the contents of that variable. So that gives us the location of the file(temporary)
on the gitlab runner server and we're passing whatever that variable value is, to another variable which we also called SSH_PRIVATE_KEY in multiple jobs(we could name
that second variable SSH_KEY for example), but this seems to be a bug in gitlab
![img.png](../img/section-4/0045_8-8.png)

The bug is whenever you pass a value of file type variable to **another** variable in your pipeline, instead of the path fo the file, the content of the file gets assigned
to that another variable. So when we have: a: $b , which b is a file-type variable, the value of `a` is gonna be the whole content of temp file of `b` and not the file path
and this will give us error because in scp ... commands, we need file paths not the actual content of that temp file.

Let's rename SSH_PRIVATE_KEY variable defined in jobs to pass to that `deploy` base job, to SSH_KEY.

The workaround is, in `before_script` of the base job which uses that variable with file content value, we're gonna create a file using those file contents. First
we echo those file contents and then pipe it into a file named **deploy-key.pem** and we're gonna use this new created file in all the places in `deploy` job
where we need the file and not the contents.

So we're getting the file contents instead of the file path passed to the deploy job but now, we're converting those contents back into a file, but we need to do
a little bit of transformation of that content, in order to save it as a valid format of the `pem` file. So the final issue is that the contents of that
file-type variable will be provided as a **one line content(value)**, but the ssh private key is a multi line file which one example of correct(multi-line) content is like:
![img.png](../img/section-4/0045_8-9.png)

Each line is 64bit(or character?)(except the first and last lines).

So we need to transform the one-line value of that file back to multi-lines.

In image below, you see that after echoing the $SSH_KEY, instead of new lines, we have spaces. So instead of spaces, we want new lines.
![img.png](../img/section-4/0045_8-10.png)

We can't do a simple replace, because we have spaces in that ... BEGIN RSA ... and ... END RSA ... , so we need a little bit advanced transformation.

To fix this, pipe the echo $SSH_KEY that is in before_script of deploy job, into a linux command named `sed`(stream editor) and we're gonna do 3 different
edits:

1) Keep the BEGIN RSA and END RSA lines as one line and then do a line break afterwards using `\n`
2) another edit for the ...END RSA... line
3) the lines between those two

Now, from one-line value of that file content, we're gonna get multi-line format which is a valid private key format.

Now let's make a change to our app code to validate that the changes in the app gets deployed all the way to the production.

### run pipeline:
Before the pipeline deploys to development, first we need to stop the container because we changed the name of the container, so it will not be able
to stop the currently running one. Why we changed the container name?
We changed the $DEPLOY_ENV which would be assigned to COMPOSE_PROJECT_NAME, from `dev` to `development`, so we would need to stop the old container by running
a `docker ps` and `docker stop <container id>`.

We can leave the staging container because we didn't change the name of that container.

deploy_to_prod is waiting for a manual approval(look at the grey icon in pic):
![img.png](../img/section-4/0045_8-11.png)

The manual approval job has that play button:
![img.png](../img/section-4/0045_8-12.png)
The top play button is for running the whole pipeline again but the one for the job, is just for that job alone. You have the same button for running the
job with manual approval on list of pipelines page.

Pipeline:
1) Test state is before we even build the app that checks and analyzes the code for security and functionality(unit tests)
2) Then we're building and pushing the image(on build stage)
3) deploy to dev and running tests on that(functional tests)
4) deploy tp staging and running performance tests on that
5) manually deploying to production
![img.png](../img/section-4/0045_8-13.png)

## 0046_1_What_are_Microservices
### microservices explained:
We have built a complete CI/CD pipeline for our demo nodejs application.
![img.png](../img/section-4/0046_1-1.png)

Let's see how to configure a CI/CD pipeline for a microservices app?
Now why is that important?

There are some specific differences and best practices for microservices.
![img.png](../img/section-4/0046_1-2.png)
![img.png](../img/section-4/0046_1-3.png)

### From monolith to microservices:
In monolithic architecture, the whole code is part of a single unit.
Everything is developed, deployed and scaled as 1 unit. This means the app must be written in a single lang with 1 tech stack with a single runtime.

For example, if developers change code for the payment functionality, you would need to build the whole application and deploy it as 1 package. You can't just
update and deploy the payment functionality changes, separately.
![img.png](../img/section-4/0046_1-4.png)

This was a standard way of developing apps, but as apps grew in size and complexity this led to different challenges:
- the coordination between teams became more difficult, because the code was much bigger and parts of the app were more tangled into each other
- if suddenly you had a usage spike in shopping cart on holiday dates and you would want to scale only that part of the app, you can't do it. You need to scale
the **whole application**. This in term means higher infra cost and less flexibility in scaling your app up and down:
![img.png](../img/section-4/0046_1-5.png)
- for example if a payment functionality used a third party module with a version 1.8 , while notifications feature needed the same module but required the version 1.7 instead,
in a monolith app, you would have to pick one or the other. Because it's a single app and could only have **1 dep of the same module**:
![img.png](../img/section-4/0046_1-6.png)
- the release process of such a monolith app takes longer. Because for changes in any part of the app in any feature, you need to test and build the whole app to
deploy those changes.
![img.png](../img/section-4/0046_1-7.png)

An answer to all these issues, was a microservices architecture.

### What are microservices?
With microservices, we break down the app into multiple, smaller and independent apps.

We have a couple of important questions when we create a microservices architecture:
![img.png](../img/section-4/0046_1-8.png)
![img.png](../img/section-4/0046_1-9.png)

First of all, the best practice is break down the app into components(or microservices) based on the business functionality(features) and not technical functionalities.
So the microservices of an online shop app will be:
![img.png](../img/section-4/0046_1-10.png)

In term of size, each microservice must do just one isolated thing:
![img.png](../img/section-4/0046_1-11.png)

A very important characteristic of each microservice is that they should be self-contained and independent from each other. This means each microservice
must be able to be developed, deployed and scaled separately without any tight deps on any other services, even though they are part of the same app and this is called
loose coupling.
![img.png](../img/section-4/0046_1-12.png)

With this best practice approach, if you change sth in the payment service, you will only build and deploy the payment service and nothing else will be affected.
![img.png](../img/section-4/0046_1-13.png)

This means the services have their own individual versions which are not dependent on others. So if I release one service, I don't need to release any other service, so this
release cycle has to be completely independent:
![img.png](../img/section-4/0046_1-14.png)

Now if these services are isolated and self-contained, how do they connect to each other? Because obviously the payment service will need sth from the user-account
to process the payment.

Answer: The services in a microservices architecture, most commonly communicate with each other via API calls.

![img.png](../img/section-4/0046_1-15.png)

Since they are isolated and talk to each other via API calls, you can even develop each service with a different programming lang and you can have
dedicated teams for each service that can choose their own tech stack and work on their service without affecting or being affected by other service teams.
This is the most important advantage of microservices architecture compared to monolith.
![img.png](../img/section-4/0046_1-16.png)

While microservices made developing and deploying apps easier, it also introduced some other challenges that weren't there before:
- one of the complexities may be configuring the communication part between the services. Because a microservice may be down or unhealthy and not responding yet,
while another service starts sending reqs to it's api, expecting a fulfilled response:
![img.png](../img/section-4/0046_1-17.png)
- With microservices deployed and scaled separately, it may become difficult to keep an overview and find out when a microservice is down:
![img.png](../img/section-4/0046_1-18.png)

## 0047_2_Monorepo_vs_Polyrepo
### CI/CD - monorepo vs polyrepo:
### CI/CD pipelien for microservices:
There are many companies with microservices applications that deploy multiple times a day. 
![img.png](../img/section-4/0047_2-1.png)

We need to know how to configure release process with a CI/CD pipeline for microservices.

### monorepo vs polyrepo:
We said microservices is when application components get developed and deployed separately as individual micro applications.

How do we manage the code for microservices app in a git repo? With one project, it was simple, we just have one app and it gets it's own git repo:
![img.png](../img/section-4/0047_2-2.png)

With microservices app, we have 2 options for how the code is managed:
- monorepo(single repository)
- polyrepo(multi repository)
![img.png](../img/section-4/0047_2-3.png)
 
Mono repo or single repo is having one repo for all the services(many projects).

How do we structure multiple micro applications inside one application repo?
![img.png](../img/section-4/0047_2-4.png)

A common way is using folders. You have folders for each service and all the code for those services are in those respective folders and
having a monorepo meaning all the services still in one repo, makes the code management and development, easier. Because you only have to cloen and
work with 1 repo, so it simplify things. Plus if you have some shared code between the services like k8s manifests, templates or helm chart or docker-compose or ... ,
you can put them in the root of the project, then all the services can reuse them.
![img.png](../img/section-4/0047_2-5.png)

But monorepo also comes with some challenges:
- As we mentioned, the most important criteria of microservices is to be completely independent and isolated. So no tight coupling between the services inside
the code and it becomes easy to break this criteria when you have a monorepo. So in monorepo, it's easier to develop tightly copuled code in our services.
- when the app becomes big, cloning, fetching and pushing become slow. Because your project is huge and in terms of CI/CD pipeline, specifically in
gitlab CI/CD, you can only create 1 pipeline for a project. So you're building multiple services with a single project pipeline and that means you need to
add additional logic in your pipeline code that makes sure to only build and deploy the service which has changed. So if you make code changes in the payment service,
your pipeline code should detect that and only that service should be built, tested and deployed and it's possible to do that using gitlab CI/CD features, but it's
challenging.
![img.png](../img/section-4/0047_2-6.png)
![img.png](../img/section-4/0047_2-7.png)

- one more issue with monorepo is that since you have just 1 main branch(because you have 1 repo), if developers of one of the services, break the main branch,
other services and their pipelines will be blocked as well.

![img.png](../img/section-4/0047_2-8.png)
![img.png](../img/section-4/0047_2-9.png)

The more preferred option is polyrepo or multiple repos.

In this approach, for each service, we create a separate git project. So the code is completely isolated.

Now even though they are separate app repos, they're still part of that bigger app, so OFC you would want to still have some kind of connection of
these repos for an easy management and overview. So in gitlab in addition to projects, you have groups.

You will create a gitlab repo group for your app called my-online-shop and inside this group, you can create a separate project for each microservice
that belongs to that app.

If your company has multiple microservices apps, OFC this will help keep an overview of what projects belong together, but also within a group,
you can create secrets or other CI variables that can be shared by all the projects in that group and in addition, you can create runners
that all the microservice projects can share.

![img.png](../img/section-4/0047_2-10.png)

What about CI/CD pipeline for a polyrepo?

The CI/CD config is more straightforward because you just have own pipeline for each repos. So no extra logic is needed to differentiate between the services.
![img.png](../img/section-4/0047_2-11.png)

Polyrepo downsides:
- having app code in multiple repos can make working on the project as a whole, harder. Especially if you need to change 2 or more services at once, because
a feature or bug fix affects multiple services
- searching or sth across multiple projects from the code editor can be difficult or impossible 
- in a polyrepo, you can't share files in a project like k8s or helm manifests, docker-compose and ... . You would either have to duplicate them in each
project's repo or have to create dedicated project and reference them from there.
![img.png](../img/section-4/0047_2-12.png)

Both options have their advantages and disadvantages but the general rule is that if you have a small project with just a several microservices, you should stick to
monorepo and save the overhead of creating and managing and checking out multiple repos.

If you have separate teams for each service, if you want to have complete isolation, smaller code base to clone, own pipelines and ... , then the poly repo
would be a better option.

![img.png](../img/section-4/0047_2-13.png)

## 0048_3_Demo_Overview
### microservices demo overview:
We have created a monorepo for this demo microservices app.
![img.png](../img/section-4/0048_3-1.png)

We will build a similar pipeline as for our demo nodejs project in which we will build and deploy each service to an EC2 server using docker-compose.

After that, we will create a poly-repo for the same project and build the same CI/CD pipeline for our poly-repo app.

We will learn concepts of reusing the pipeline configuration for multiple services in both monorepo and poly-repo setups.


![img.png](../img/section-4/0048_3-2.png)


## 0049_4_Monorepo_Start_services_locally_and_get_to_know_the_Application
### monorepo project overview:

### clone project locally & go through the code:
Each service folder contains everything that the service needs to be started and built and ... . 
![img.png](../img/section-4/0049_4-1.png)

Each service is programmed in a way that it can be run and built completely isolated from other services, independently, so there is no code deps between them,
they just talk to each other with the API.

### start the services locally:
Each service can be started in any order(they can be started separately).

Do `npm start` on frontend and backend services to start them.


## 0050_5_Prepare_Deployment_Server_Monorepo_Demo_Part_1
### monorepo demo -1 - prepare deployment server:
### configure gitlab runner:
In settings>CI/CD , you will see that we have no specific runners registered and we have to register our own specific runners for this project or we could also
use the shared runners.

We already have runners that we created and registered for the other project and it is possible to share the runners **between the projects**. So we could add
additional runners and register them with this project specifically or we could share or reuse the ones that we used for another project.

Let's reuse the specific runner from previous project that is a shell executor but also has docker installed in it(because we need docker now), so docker commands are available.
To reuse runners, go to the project that has that runner and go to settings>CI/CD and click on the edit icon of that runner. Then uncheck the checkbox that says:
"Lock to the current project".

Then in the project you want to reuse a runner, click on the Enable for this project button of the specific runner that you want to reuse.

Now, we're using the same runner for multiple projects. Since the specific runners are always assigned to the project, by default they will be locked to that
project, so we have to unlock it and then you'll be able to reuse it in other projects.

The project which we originally created and registered those specific runners for it, after we enabled one of the runners to not be locked only for that project:
![img.png](../img/section-4/0050_5-1.png)
![img.png](../img/section-4/0050_5-2.png)

### create EC2 instance & prepare server:
Now we need a deployment server for this project, to deploy all our services.

Note: Delete the deployment server for the earlier nodejs demo project.

On this new EC2 instance, we're gonna do:

Note: Store the SSH private key to access this new server, on your machine.
![img.png](../img/section-4/0050_5-3.png)

In aws, click on launch instance with 20.04 version of ubuntu.

Click on create a new key pair button and let's call it `microservice-deployment-server-key`:
![img.png](../img/section-4/0050_5-4.png)

Now the key-pair file is downloaded. Now we have a SSH key to be able to SSH into our server.

While our instance is initializing, let's restrict the permission of the downloaded ssh key file(.pem file), so that we can actually use it to SSH into the server,
by running: `chmod 400 <path to that pem file>`.

To connect to that server using the downloaded SSH key: `ssh -i <paht to the downloaded pem file> <user like ubuntu>@<IPV4 public IP of server like 13.37.235.23>`.

To grab the public ip address of server, you're gonna go to this page: 

![img.png](../img/section-4/0050_5-5.png)

Now we need to install docker and docker-compose:
```shell
sudo apt update # because we're on a fresh server, so we need to update the repos
docker # would throw an error with a command to install docker
sudo apt install docker.io
docker-compose # again would suggest the command to install it
sudo apt install docker-compose

# now, we need to make ubuntu user(default user) be able to execute docker commands without sudo to avoid the permission denied issue:
docker ps # only for demonstrating we're gonna get permission denied issue
sudo usermod -aG docker $USER # add(the -a flag means add) the current user($USER) to the docker group(-G flag means group)
exit

# login again to server using the mentioned ssh command...
# ...

docker ps # this time, the command would run without permission denied issue(and we also ran the command without sudo which is nice)
```

Now everything is setup on our deployment env.

Now let's create our pipeline config that will build the docker images of our services and deploy them on the development server.
![img.png](../img/section-4/0050_5-6.png)

## 0051_6_Build_Micro_Services_Monorepo_Demo_Part_2
### monorepo demo - 2 - build services:
In the root of the project, create .gitlab-ci.yml .

So we're gonna have 1 pipeline config for all the services(backend and fronted) in this app.

We're gonna skip some jobs in real life pipelines such as testing jobs.

![img.png](../img/section-4/0051_6-1.png)
![img.png](../img/section-4/0051_6-2.png)

First let's define the stages using `stages` attr.

For `build` stage, we're gonna create a job that will build and push docker image of a microservice in 1 job(1 step). So we're not gonna have a 
separate build and push jobs, we're gonna have them in one.
But we're building 3 different services which means we need to have 3 different build jobs for each service(1 service -> 1 build job).

### add build job for each service:
Since we're gonna build multiple service images and they're gonna be all stored in the same container registry, we need multiple image repos and we're gonna
create them using paths that append to `$CI_REGISTRY_IMAGE`.

In monorepo we need those paths appended to `$CI_REGISTRY_IMAGE` because each service will have it's own image repo to differentiate between them. 

Let's say the frontend app version is 1.3, so let's set `IMAGE_TAG` to 1.3 there.

Microservices are built and deployed separately, so they can have independent versions, so for example the fronted service is at version 1.3, while products service at 1.8 .

### build only when code changed in that service:
With current configuration, everytime one of those services changes, all 3 jobs will run in parallel which is not what we want. Instead,
we only want to build the service that has changed. So if the code changes were made in frontend folder of the project, only the
build_frontend job should be executed and other build jobs should be skipped.

How do we configure that?

Add a condition to the job which that conditions says when to run it. We add a condition in this case using `only` keyword.

This code means only run the job when the `changes` happen in any file or folder inside the `frontend` folder:
```yaml
only:
  changes: 
    - "frontend/**/*"
```

![img.png](../img/section-4/0051_6-3.png)

Let's test the CI by pushing to repo(for testing, we can push directly to main branch).

**Important:** Now sth interesting happens. Because we only changed the ci config file and no changes were made to the services code, the pipeline wouldn't run.

Now to trigger the pipeline, change some code in one of the services and push to gitlab's main branch or create a MR.

### Reuse shared build code:
Let's create a generic hidden job called `build` that will contain the common config for building and pushing docker images(the building and pushing should be in
separate jobs but we stick them together for simplicity). Each specific service build job will extend from this generic job.

We can pass parameters to a base job that we're extending in the specific jobs, using variables. So define the variables attr in that base job and choose the names
of variables that might be passed from the jobs that extend it and also assign a default value to those variables. For example we defined a variable called
MICRO_SERVICE and assigned a default value fo empty string to it and that variable can be passed a value from the job that extends it.
Then reference those variables in that base job.

In gitlab it's not possible to use variables in certain places(in some places, variables do not get expanded) and one of those places is `only.changes` attr.
So we can't use an env variable there, which means we're gonna define that only.changes attr in the specific jobs themselves rather than in the base job with a parameterized value.

To pass variables to that base job, just specify a `variables` attr in the specific job that use `extends`.


## 0052_7_Deploy_Micro_Services_Monorepo_Demo_Part_3
### monorepo demo - 3 - deploy services:
### add generic docker compose:
We created the build job for our services, let's create the next stage which is deploy and create deploy jobs.

We're gonna use docker-compose to deploy each service, but each service will be deployed with it's own docker-compose file. Because they need to be
deployable separately. Plus when we do `docker-compose down` in order to stop the previous version of the image and after it, start a new one,
we don't want to stop any **other** services, just the one that we wanna update.

However, we also don't want to duplicate code and have 3 docker-compose files, so what we're gonna do is we're gonna create a generic docker-compose file
in the root of the project that all services can reuse and we're gonna make it customizable for each service. The value of image attr in the generic
docker-compose is gonna be customizable so we should accept it as a variable named `DC_IMAGE_NAME`(DC stands for docker compose).

We also want to be able to customize `ports` attr of that docker-compose because each service has it's own port and we can have
separate ports for the host and container. In our case, let's just go with one. So whatever the container port is, we're gonna use the same for the host.
So we're gonna write: `${DC_APP_PORT}:${DC_APP_PORT}`.

Now we're able to use that generic docker-compose for each service to deploy it without affecting the containers of other services, when deploying the service
with that generic docker-compose.

### Add generic(hidden) deploy job:
Let's create deploy jobs for all 3 services(for each service, we're gonna have a build and deploy job).

Let's first create the base deploy job named `.create`(it's hidden). In it's before_script, we wanna do 3 things:
1) Limit the permission of SSH_PRIVATE_KEY of the deployment server(we have to define that SSH_PRIVATE_KEY variable in the project's global variables section).
We're gonna create that variable in settings>CI/CD>variables section to make it available for the pipeline:
![img.png](../img/section-4/0052_7-1.png)
Why limit the permission to 400?
Otherwise, aws will not allow SSHing into EC2 instance server.

2) Then we want to set two env variables

Note: You can setup a name for the launched ec2 instance:
![img.png](../img/section-4/0052_7-2.png)

`scp` command is secure copy

The `docker-compose up -d` in `script` of deploy hidden job, will start the services defined in the root docker-compose file of our project which is just one service named
`app`. But we already have running containers, we would have to stop them first, so before `up` command, we do a `down`(to stop any old containers of that service before
staging the new one) command of `docker-compose`.

Note: Our root docker-compose file expects some variables to set, so in that script of .deploy, we need to set them before `down` and `up` commands of docker-compose.

![img.png](../img/section-4/0052_7-3.png)
![img.png](../img/section-4/0052_7-4.png)

In `.deploy`, we're gonna accept some variables so set up the variables section there(note: The $SSH_PRIVATE_KEY comes from the global variables of gitlab that we're
gonna set up in CI/CD page of settings page of gitlab, so we don't have to pass that to that `.deploy` job).

The `DEPLOYMENT_SERVER_HOST`(public IP address of the deployment server) is gonna be the same for all the services, so we can set it as a shared variable in
variables section of the pipeline.
![img.png](../img/section-4/0052_7-5.png)

COMPOSE_PROJECT_NAME overrides the prefix that the container name gets, when we start it from the docker-compose file. By default, when we start the
container inside the docker-compose, the docker-compose will put together container name using:
`container name: <the folder where the docker-compose is located>_<service name which is defined in services attr of docker-compose file>_<index>`
and if we leave that as default name of container, what would happen is that all our 3 services will have the **same** container name! and we don't want that
because we're only gonna be able to start one container. Instead, we want them to have different names. For this, we're gonna override the prefix(the word before first underscore)
and we're gonna set the microservice name there.

![img.png](../img/section-4/0052_7-6.png)

In 2 pics below, the service name is app actually and not ubuntu_App_1 or ... .
![img.png](../img/section-4/0052_7-7.png)
![img.png](../img/section-4/0052_7-8.png)

And to override that prefix word(the folder name where docker-compose file lives), we set the special env variable named `COMPOSE_PROJECT_NAME` to the desired value.

APP_ENDPOINT value could be the same value as the public IP address or the DNS name in our case.
![img.png](../img/section-4/0052_7-9.png)

### Add deploy job for each service:
We have created the base deploy job, let's not create the specific deploy job for each service. Let's create deploy_frontend job first.

Now, if sth in the frontend directory, the build_frontend and deploy_frontend jobs will be executed and other jobs related to other services will be skipped:

![img.png](../img/section-4/0052_7-10.png)

### configure a common docker network:
Since we're deploying our services with separate docker-compose files, we need to setup this.

By default in docker-compose what happens is, when we start the services inside docker-compose with docker-compose up command, docker-compose will create a 
docker network and all the services that are listed in that docker-compose file, will be started in that network.
![img.png](../img/section-4/0052_7-11.png)

If you do `docker network ls` you can think of each network as an isolated virtual network that has possiblity to run containers inside it:
![img.png](../img/section-4/0052_7-12.png)

and with docker-compose, whenever we start services in docker-compose, docker-compose will create a new docker network and all the services will run inside
that network and the name of that network by default will be: `<the folder name where that docker-compose file is>_default`.
But in our case, it's gonna be different, because we have set that `COMPOSE_PROJECT_NAME` env variable which sets the name of the docker-compose project to that specified
value which in this case is the microservice name and COMPOSE_PROJECT_NAME overrides not only the prefix of container name inside the docker-compose, but also the prefix of the
name of the network of that docker-compose. So for example, we're gonna get a new network name like: `frontend_default` as **network** and `frontend_app_1` as **container** name which will
run inside that mentioned network.
![img.png](../img/section-4/0052_7-13.png)
![img.png](../img/section-4/0052_7-14.png)

However there's a problem with that, because when you have containers in different docker networks, they can't communicate with each other, so they can't talk to 
each other from different networks. OFC there are different tools to configure that they can start communicating, but **by default**, without any configuration,
they can't talk to each other.
![img.png](../img/section-4/0052_7-15.png)
So we want all 3 containers when they start, to be in the same network and when they are in the same network, the containers can talk to each other using container names.

So we don't want docker compose to create own network whenever it starts the services, we want it to create 1 network and start all 3 apps inside it.

So instead of products_default or frontend_default as name of the network, we want 1(and only 1) network which has a consistent name

Q: How we can overwrite the name of the network the docker-compose creates?
First, we have to define the network that we want to create using `networks` attr.

There is one required attr for any network and that is `driver`. driver: bridge is what docker-compose uses by default.

By setting the name of the network, this will only change the `default` word in the default name of a network. So it will not replace the whole default network name.
So we will still get the prefix which would be either the enclosing folder of the place where docker-compose lives or **in our case**, the value of
COMPOSE_PROJECT_NAME and we don't want that, because that's gonna be different for every service and we want 1 network name.

So how can we overwrite the first word of default network name in docker-compose?

We use `name` attr in each network we create in `networks` attr.

Now we need to reference that network in our services, otherwise, docker-compose will use the default network for the services.

Now our containers will run in the same network which means they can talk to each other using the container name.

In Dockerfile of frontend service, we have 2 env variables like PRODUCTS_SERVICE and SHOPPING_CART_SERVICE which are essentially the endpoints where we use to 
talk to the other services and when we start them using docker-compose and if they are in the same network, frontend service can access the other containers of that
same network using those env variables.
![img.png](../img/section-4/0052_7-16.png)

### use a pre-existing docker network:
Alternatively, we can use an external network inside docker-compose. We can tell docker-compose: Do not worry about network, we already have one taht we created and please
use that to start the services defined inside that external network.
![img.png](../img/section-4/0052_7-17.png)

For this, inside one of the networks in the global networks attr, use external attr. 
Note: In this case, remove the driver: bridge because we're not creating or we're not allowing docker-compose to create it's own network, instead, we're saying to docker-compose:
please do not create a network, use an existing one that we already have created, so it already has it's driver, so no config is needed for `driver`. Just inf a netowkr on the machine
that is called with the value of `name` attr(which is gonna be the docker network name) and then we're gonna reference that external network inside the docker-compose config and
tell docker-compose to run all the service containers inside that external network and we're gonna take care of creating that network ourselves, using simple
`docker create network <name of network>` command. Do this in script attr of .deploy job.

We need to add some code that says: If the network with the name `micro_service` already exists, then just return the result(in this case `true`) and continue with the next line.

The quickets way to fix the problem when having an existing network with the name that we again want to create, is to use || which in line below means: if
`docker network create micro_service` doesn't work(errors out), just return true.
`docker network create micro_service || true`.

So if `micro_service` network exists, the command above will just return true.

### Create SSH_PRIVATE_KEY variable:
Go to settings>CI/CD>variables section:

Note: To get value of that SSH_PRIVATE_KEY, use: `cat <path to the pem file>` and copy the result but without the percentage sign at the end.
![img.png](../img/section-4/0052_7-18.png)
Now, that variable should be accessible for our pipeline.

Now test the pipeline by pushing the code to repo(MR or directly to main branch to trigger the pipeline(IF the source code of services changed)).

### Access frontend:
To be able to access the app with public DNS or public IP address of the server on port 3000. However we need to open the port 3000 in our firewall config in aws.

The view inbound link in pic below, shows the opened ports:
![img.png](../img/section-4/0052_7-19.png)

To do this, click on launch-wizard-18:
![img.png](../img/section-4/0052_7-20.png)
![img.png](../img/section-4/0052_7-21.png)

After deploying all 3 services, if we run `docker ps`:
![img.png](../img/section-4/0052_7-22.png)
![img.png](../img/section-4/0052_7-23.png)

To inspect Network info of the network that we created(look at `NetworkMode`):
![img.png](../img/section-4/0052_7-24.png)

The other containers should have NetworkMode: micro_service which means they are in the same network. Which means, for example the frontend can talk to
products service using it's container name(products_app_1) which is what we set as an endpoint in the frontend application's dockerfile as env variable.

After pipeline finished, you don't need to refresh the web app to see the changes!

All 3 of our services have been deployed using our pipelines and we can individually update build and deploy each service without affecting others and that's
how CI/CD config for monorepo microservices app works.

![img.png](../img/section-4/0052_7-25.png)


## 0053_8_CI_CD_pipeline_for_Polyrepo:
### CI/CD polyrepo demo:
We saw how to create a re;lease pipeline for a microservices app in a monorepo.
![img.png](../img/section-4/0053_8-1.png)

Now let's see how release process looks like for a polyrepo equivalent of the same project?
![img.png](../img/section-4/0053_8-2.png)

### Create group and projects:
Instead of a gitlab project, we're gonna create a group and then inside that group, we're gonna have individual projects for all 3 microservices.
![img.png](../img/section-4/0053_8-3.png)

In real-life, the name of the group would be the name of the application
![img.png](../img/section-4/0053_8-4.png)

Then create new projects, one for each service. For example, for frontend project:
![img.png](../img/section-4/0053_8-5.png)

Now we have 3 empty projects inside our microservice-cicd group and now we need to take all the code for frontend service and put in that frontend repo. 

Now we have our polyrepo microservices project:
![img.png](../img/section-4/0053_8-6.png)

Now let's build a ci/cd pipeline for our microservices.

### Register a gitlab runner for group:
Let's prepare a couple of things just like our monorepo project, before we create the pipeline.

First of all, we need to configure gitlab runners for our project. Currently, this is our project:
![img.png](../img/section-4/0053_8-7.png)

Go to one of the projects, then to settings>Ci/CD page where it is the place that you can configure variables, runners and ... and right now, we don't have
any actively configured runners there:
![img.png](../img/section-4/0053_8-8.png)

In a group, we have an advantage that we don't have to configure runners, **individually** for each project of that group, instead, we can share
some of the configuration.
![img.png](../img/section-4/0053_8-9.png)

So on the group level page, you can see we have some of the configurations(look at the sidebar of the pic):
![img.png](../img/section-4/0053_8-10.png)
For example we have the container registry which is for the whole group. In Ci/CD page, we have runners which can be reused by the whole group and
we have the settings for the whole group that all the projects inside can use. So we can define shared variables, shared runners and ... .
![img.png](../img/section-4/0053_8-11.png)
![img.png](../img/section-4/0053_8-12.png)

So as a first step, let's create a group runner that all the projects inside that project can use and this time we will create a new runner(and not enable an
already existing runner for this group) on our remote runner machine and register it with our group. You can also register a **local** runner as well, as long as you have
docker on it up and running.

For registering a runner, we need the token and in this case, instead of a project token, we need a **group token**.

In a group and in it's CI/CD page>runners page, you see an overview of all the runners including group runners and project runners. Because you can have
runners that are only specific for one of the projects inside the group or you can have shared(group) runners.

Click on Register a group runner.

The token of the group for authenticating and registring the runner:
![img.png](../img/section-4/0053_8-13.png)

To create and register the runner, SSH into our gitlab runner server(related ec2 instance) and register the runner(if you don't have a runner installed,
you must first install it):
```shell
ssh -i <path to the privagte key pem file> <user like ubunutu>@<public IP of ec2 instance that is our gitlab runner like 13.38.115.138>
```

Then run the highlighted command in the pic, in the server that you have SSHed into it:
![img.png](../img/section-4/0053_8-14.png)
Then, it will ask for gitlab instance URL and then it will ask for token which you can copy from the prompt. Then it will ask for description. Then the tags(we're gonna
have it with shell executor, so add `shell` as one tag):
![img.png](../img/section-4/0053_8-15.png)

The gitlab runner is now registered. We can check the status by running this command on that server:
```shell
sudo gitlab-runner status
```
![img.png](../img/section-4/0053_8-16.png)

Now we have the group runner:
![img.png](../img/section-4/0053_8-17.png)

Since we're gonna be building docker images and deploying using docker-compose, obviously we need a gitlab runner for our microservices projects inside the group that has
docker and docker-compose both installed on it. So if you're creating a runner on a different instance or locally, make sure you have docker and docker-compose available.

After some time, our group runner is gonna become online which means it's ready to run our jobs.

Now as the second step:
### prepare deployment environment:
We're gonna reuse the same server that we used for the monorepo project,but in order to be able to reuse that, we need to stop all the docker containers currently running
on it, then remove the containers and images, so that we're starting from a fresh state.
![img.png](../img/section-4/0053_8-18.png)

First ssh into the deployment server. Then:


![img.png](../img/section-4/0053_8-19.png)

Then run docker **stop** with all the container ids that you have:
![img.png](../img/section-4/0053_8-20.png)

Now **remove** all the containers using `docker rm <... all of the container ids separated by space>`.

THen check the images:
```shell
docker images
```

Then run `docker rmi` with: `<name of the image>:<version>` :
![img.png](../img/section-4/0053_8-21.png)

If it errors, maybe you still have some containers, so run `docker ps -a` and then `docker rm <...container ids>` :
![img.png](../img/section-4/0053_8-22.png)

Then try the `docker rmi <...container names>` command again:
![img.png](../img/section-4/0053_8-23.png)

Now if you do docker images , you should see not any images.

Then, run: `docker network ls` and remove the networks that you have created yourself like `micro_service` network, using `docker network rm <...own network names>`.

The bridge, host and none networks are the default ones and should not be deleted.

Now we have a fresh state(with docker and docker-compose installed) for completely new deployment.

### create SSH_PRIVATE_KEY variable for the group:
As the final step before pipelines preparation, we're gonna create the SSH_PRIVATE_KEY variable for the deployment server, so that gitlab can connect to that and deploy the
services.

In groups, we can create **shared** variables that all the projects of that group can reuse, instead of having to create the same variable multipl;e times for the  projects
of that group. Go to settings > CI/CD > expand variables section and create a variable with `file` as it's type and for it's value, run sth like this on your
machine(not the SSHed server!):
![img.png](../img/section-4/0053_8-24.png)
and copy the contents of that pem file without that last percentage.
![img.png](../img/section-4/0053_8-25.png)

So the things we had to to before creating the pipelines:
1) SSH into runner server
2) remove all running containers images and self-created networks there
3) create the ssh private key variable using the downloaded key of that server(like the downloaded key of EC2 instance) for that group, so gitlab can SSH into that server in pipeline

Now we have set up everything we need to create pipelines(**we would have multiple pipelines in polyrepo style, one pipeline for each microservice**) for
our projects that are inside one gitlab group.

### Pipeline configuration:
Create .gitlab.ci-yaml and a docker-compose file for each of our microservices.
Let's create the same pipeline as for our monorepo, taht will build and push a docker image to the registry and deploy that image and for deployment, we're
gonna use the same docker-compose file that we used.

![img.png](../img/section-4/0053_8-26.png)

In polyrepo, we have to create .gitlab-ci.yml and docker-compose file for each service, because we don't have a shared repo.

We could make the docker-compose file in services, more specific(without parameters) because each service has i't own compose and ci config files,
for example in `services` attr of frontend, we can use `frontend` as the name of the `service` instead of `app` and we can for example hard code the port and ... ,
however we're still gonna keep it generic and customizable, because we want to keep the pipeline code, generic.

![img.png](../img/section-4/0053_8-27.png)

We have created a polyrepo for our microservices app and configured a release pipeline for each of the services inside that polyrepo.

## 0054_9_Extract_common_logic_Job_Templates_Part_1
### job templates - 1 - extract common logic:
### introduction:
We're repeating the same config(pipeline config code) for all the services in our poly repo and this is one of the disadvantages of polyrepo that you have a code
or config that all services need and you have to replicate it within each service, because you have to have it in each project separately, like docker-compose file 
or the pipeline config.
![img.png](../img/section-4/0054_9-1.png)

Imagine we had full(real-life) CI/CD pipeline with multiple test jobs and deploying to 3 different envs, we would repeating config code a lot. Plus,
each service team would have to write their own pipeline and manage that and with time, the release pipelines of different services may end up being completely different
and inconsistent, for example each service maybe release with different tests, pushing to different docker repos and ... , instead of having a optimized pipeline that
all services can reuse.

![img.png](../img/section-4/0054_9-2.png)
![img.png](../img/section-4/0054_9-3.png)

So what is the best practice here and how can we optimize this?
For that, we have templates and template library in gitlab. What's that?
The job template is equivalent to jenkins shared library.
![img.png](../img/section-4/0054_9-4.png)

We take the common pipeline config, make it generic and reusable and put it into it's own separate git project and any project that needs that config, can refrence
it and fetch it from that separate repo.
![img.png](../img/section-4/0054_9-5.png)
![img.png](../img/section-4/0054_9-6.png)
![img.png](../img/section-4/0054_9-7.png)
![img.png](../img/section-4/0054_9-8.png)
![img.png](../img/section-4/0054_9-9.png)
![img.png](../img/section-4/0054_9-10.png)

To do this, we need to split our pipeline config and extract the config that should be shared, into a separate yaml file

![img.png](../img/section-4/0054_9-11.png)

There are 2 types of templates in gitlab:
1) pipeline templates: Which are for the whole pipeline. You don't have to write it from scratch.
2) job templates

![img.png](../img/section-4/0054_9-12.png)

### See "local" template first:
Create .build-template.yml(the name doesn't have to start with dot, it just needs to be a yaml file) and extract build_frontend job there.
Frist rename the build_frontend to build and then we can remove the `tags` attr. Because we may want to run different jobs on different runners, so we don't want
to hard doce where the job would run using tags.

![img.png](../img/section-4/0054_9-13.png)
![img.png](../img/section-4/0054_9-14.png)

Currently, we're using a mixture of predefined variables and variables that need to be passed in as parameters, so **optionally** for a better overview of what
variables we need to pass, we can list them with global variables attr in that generic build.yml file.
This way when we use that job template in one of our project pipelines, we know which variables are coming from the predefined variables, so we don't have to set them
and we know which ones we need to actually provide as parameters, because if we don't provide them, the job will fail.

So you can list them for overview or if you want to use some default values in case nothing is passed, but it will work without them too(it's just for demonstration and
I kept them as comments for reference.).

After including the template job, we have that job available in our pipeline and we have to make that job active and we do that by **referencing the job name(it has to be
the name that was used inside that template file)** and we can pass any params to that job using variables attr inside that job. So this:
```yaml
build:
  tags: 
    - remote
    - group
    - shell
```
will trigger the build job template that was included and specify a tags attr for it too(all the variables that that job template wants, are defined in **global** variables attr of 
our pipeline, so we don't need to pass them again(because we used global variables attr on pipeline, they are automatically available for that template job)).

Note: We **had to** use `build` as the job name because it is the name of the job defined in the template file. So we used `build` as the name in our ci config file.

![img.png](../img/section-4/0054_9-15.png)

**Note:** Put all the include statements at the beginning of the pipeline(it's irrelevant though!).

![img.png](../img/section-4/0054_9-16.png)

Since we have that job template locally in the same project, we can use local keyword when specifying the path of that template to tell gitlab that we're referencing
our local job template.
Another keyword(like `local`) for include attr, is template which is used for referencing gitlab's managed repository templates.

![img.png](../img/section-4/0054_9-17.png)

This type of splitting your pipeline config can even be useful if you have a huge pipeline code for one specific project, that you want a better organized and split into
multiple yaml filesS(instead of having one big file). You could have a templates folder where you include all those templates to have smaller code in each file.

![img.png](../img/section-4/0054_9-18.png)

**Note:** In order to pass some additional logic(like some lines of logic to be executed before the template logic in before_script or script) to template jobs or pipeline jobs, from
specific jobs that use templates, if you add some logic in that specific job, it will overwrite whatever is defined in the script or before_script of template job.
So it won't concatenate those lines from specific job to the template job's script or before_script, instead, it's gonna replace all the logic in that template.

IF you actually want to have some lines added to that template's script or before_script, you would have to provide the whole logic(specific + template), to the template.
**So you need to pass whatever is defined in the template already + your own custom logic code.**

Create another template job for deploy called `.deploy-template.yml` and cut the code for `deploy_frontend` job code to that new file and rename the job template name
from `deploy_frontend` to `deploy` to make it a more generic name.
Then remove the tags section, because we may want to run that job on different runner, when we use that job template in a specific job in future.

Then add:
`local: '.build-template.yml'` to the `include` section of your ci config file. So now we have:
```yaml
include:
  local: '.build-template.yml'
  local: '.deploy-template.yml'
```

Then write the same job tempalte name(which is deploy in this case), in your ci config file to activate the included job template and pass the things that you need to pass
to job template, like `tags`, for example:
```yaml
deploy:
  tags:
    - remote
    - group
    - shell
```

That's how you extract jobs into job templates by making them reusable and include them in your pipeline config.


## 0055_10_CI_Templates_Library_for_all_projects_Job_Templates_Part_2
### include template from another project:
We need those `.build-template.yml` and `.deploy-template.yml` templates for other services as well to include them in their pipeline configs.
OFC it doesn't amke sense to copy them in each project.

So let's create a common project for our services and call it `ci-templates`(it's a polyrepo, so create a root level directory named `ci-templates`) and
you can create this project outside the projects group, in our case we're gonna share this configuration among our microservices, so we're gonna create those **inside the group**. 

Then those two job template files and move them to that new project and rename those files to `build.yml` and `deploy.yml`.

Now this project and it's files can be used by any project in your gitlab instance(if you have permission to use that templates project).

Now that we don't have those job template files locally, how do we reference them from another repo?

For that, instead of using `local` keyword with `include`, use `project`, for example:
```yaml
include:
  - project: parsa/ci-templates
```
In above, we're telling gitlab that we want to include a yaml file from a project called ci-templates but we also have to specify in which gitlab instance or gitlab group that is?
In oru case, we have the project we want to include, inside the group, so we have to specify the **group name**, for example the group name is: `mymicroservice-cicd`, so:
`mymicroservice-cicd/ci-tempaltes`
If you have the project containing ci templates **outside** of the group, then instead of groupName, you have to specify your gitlab username, like: `parsa/ci-templates`.

![img.png](../img/section-4/0055_10-1.png)

Now we want to tell gitlab which files from that templates project, we want to include in our pipeline config.
For that, use `file` keyword which can be a list and we can also use a keyword called `ref` and it references either a branch in that included project or a specific commit hash or a tag:
```yaml
include:
  - project: parsa/ci-templates
    file:
      - build.yml
      - deploy.yml
```

Now include those job templates in other services.

If you have some env variables that have the same value among your projects, you can extract them to the job templates that are included in the projects.
For example, we extracted `DEV_SERVER_HOST` and `DEV_ENDPOINT` variables. So these can be defined in job templates and have default values, but you can overwrite them
in your ci config files.

We have created pipeline configuration for our polyrepo project, using the best practice of extracting the common code and putting them into what's called template library that
has multiple job templates and then referencing them in your pipelines as you need them.

### Wrapup: include:
The value of `remote` can be any url that references a yaml file, like:
`https://gitlab.com/awesome-project/raw/master/.before-script-template.yml` which is on the gitlab of someone else's project. Or it could be also an endpoint of a storage that
holds your job templates like s3 bucket or some other file storage that holds some gitlab ci-cd pipeline config files, so they're not gitlab projects but storage endpoints, which can
be referenced using remote keyword.

With template keyword inside include, gitlab knows we're trying to reference that official template repository of gitlab, so you don't have to specify the full path, you just
have to specify either directory inside the project or directory of the file in the root folder. 

![img.png](../img/section-4/0055_10-2.png)
The include example in above image which has multiple **types** of include, is absolutely valid syntax, which means you can include yaml files and job templates
for multiple different sources, different types of sources and basically you can mix it up, like:

![img.png](../img/section-4/0055_10-3.png)
![img.png](../img/section-4/0055_10-4.png)

So this was microservice pipeline configuration that deploys to ec2 instance and runs services as docker containers.

