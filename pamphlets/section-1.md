# 0001_1_Introduction_and_Course_Overview
Some stuff we will learn:
- what is CI/CD?
- gitlab compared to other CI/CD platforms
  - gitlab CI/CD vs jenkins
  - gitlab CI/CD vs azure pipelines
- gitlab architecture and how it works
  - gitlab runners
  - scope of runners
  - gitlab executors
  - different executor types: shell, docker, ...
  - we will create and configure our own runners for the gitlab instance 
    - configure local runner on macos & windows
    - configure a remote runner on AWS
- we will look at different ways of operating gitlab and see managed vs self-managed gitlab platform

Once we have the infrastructure set up, we will learn the core concept of gitlab CI/CD, like:
- jobs
- stages
- pipeline syntax
- how to use conditionals
- regular & secret variables
- reusing configuration code to avoid duplication
- concept of artifacts and how to generate test reports as well as share data within the pipeline using the artifacts
- how workflow rules can be used to define when the pipelines should be triggered
- needs vs dependencies
- gitlab's builtin docker register and how to use it in the pipeline

Then, we will learn:
- how to speed pipelines and save costs using cache
- how to use the include feature 
- how to use gitlab's job templates in your pipeline
- how to extract common piepline code and build job with extends feature to make your pipleine configuration more maintainable

paste the image here and screenshot earlier pics and paste them here.
![img.png](../img/section-1/0001_1-1.png)

In first project, we will build a real pipeline:
- testing the app with unit tests
- and security tests
- incrementing and dynamically setting version for the docker image
- building and pushing the image to gitlab's docker registry(push to docker registry)
- doing multi-stage deployment to the deployment server with docker compose(`the deploy to dev` step)
- promoting from development, staging and production environments

after that, we will work on building a CI/CD pipeline for a microservices application in a monorepo
![img.png](../img/section-1/0001_1-2.png)

and then do a demo and compare building CI/CD pipeline for a polyrepo.
![img.png](../img/section-1/0001_1-3.png)

So you'll learn how to do both and throughout these demos, we will use best practices of:
extracting and reusing config code for multiple services by creating a gitlab CI-templates library.

![img.png](../img/section-1/0001_1-4.png)

Here we use docker compose to deploy it to the services but in the final demo, we will take this one step further and configure continuous deployment of
microservices to a K8S cluster.
![img.png](../img/section-1/0001_1-5.png)


## 0002_1_What_is_CI_CD
- What is CI/CD?
- What does a CI/CD platform do?
- Why do we need it?

Everytime you improve your application either the code itself or the server configuration, you want to make this improvement accessible to the end users
immediately.

So after the initial launch, you do multiple updates to your app and to keep track of those updates, you version those changes. There are many ways to version
applications changes. You may choose the one with 3 version numbers: major minor patch and you do these over and over again:
1) You have idea of an improvement
2) you code it(implement)
3) test it
4) build and package it 
5) deploy 
6) observe it after release to see: 1- are there any new improvement ideas? 2- are there any issues that need to be fixed 

So you have a process of continuous delivery of changes. An endless cycle of improvements. 
img-8

CI/CD is a method to frequently deliver application changes to customers in an automated way.

### CD:
In prod env, the app is accessible to the end users.

Why we don't directly deploy the app to the prod env?
Because we aren't sure that the changes are safe and they won't break stuff and for huge apps, any small change may affect the whole app.

So we deploy that app in stages, so that we can test the changes before we really full release it.
img 8

So we deploy to the first stage which is often called the development stage which is very similar to the final production stage and we **test** the changes there.
We run some automated tests like unit tests and functional tests to see the app functions properly. If tests fail, we don't continue anymore.

Next stage is testing, staging or pre-prod env which again, should be as much identical as possible to the final prod stage, because we don't want any
surprises. We may want to do some performance tests here like ram and cpu usage and actual performance.

Next stage is called production.

Continuous deployment:
- every code change is built, tested and deployed to the different environments
- deployment to production happens automatically without explicit manual approval

### continuous deployment vs delivery:
TODO: TILL 5:42

### continues deployment vs delivery:

#### continuous delivery: 
In many projects, automated testing is not 100% reliable. Because someone needs to write those tests and often developers have a pressure
to develop new features and not enough time to actually write those tests.

Or the application logic maybe is so complex that writing automated tests in order to test every aspect of the application, is difficult.

Or it could be management simply feels not confident automatically deploying to the production and there should be someone, a human, who manually approves
the final release step to production(or maybe other releases to for example the staging stage). 

So basically it's really possible that you don't have automated test that you can 100% rely on. Which means you can't automatically deploy all the way
to the production without a human intervention in the process, in which case, you need some manual testing where test engineers coming and manually test that
app in addition to the automated test and this means you can streamline the deployment only to the non-production stages(or maybe other stages), so that the pipeline
will be automated until development or staging environments and will be then promoted **manually** to the production and this has it's own term and it's called
**continuous delivery**.

![img.png](../img/section-1/0002_1-1.png)
![img.png](../img/section-1/0002_1-2.png)
![img.png](../img/section-1/0002_1-3.png)

### CI part:
We saw the CD part which is either continuous delivery or continuous deployment.

Now about continuous integration part:
The pipeline actually starts from this part not the CD part.

When a developer commits their code changes to git repo, that triggers the pipeline.

We have the main branch, devs are working on code in parallel, each of them having their own local copy of that code. So they make changes
to the same codebase locally and changes of these devs need to be integrated or merged to that central shared code.
![img.png](../img/section-1/0002_1-4.png)
![img.png](../img/section-1/0002_1-5.png)
![img.png](../img/section-1/0002_1-6.png)

### why continuously integrating the code changes is important?
- updating the local copy and merge conflicts: 
First dev pushes some code, then the second dev wants to also push her local changes but now her local copy of the main branch is not the same
as the remote branch anymore. Because it has changes from the first dev that the second dev doesn't have yet locally. Also on top of this, it could happen
that **they both change the same code** in which case the second dev will get a conflict. Git will say: I don't know which changes to take. Now in this case,
the second dev obviously doesn't want to overwrite the changes of the first dev, therefore they talk it out and decide how to merge the conflicting changes(now
the second dev has it's code pushed and merged correctly).
- another problem is that when you have lots of code changes that you worked for quite some time, you don't know how much you affect the app? Did you
break any features? How do you find out whether you broke sth in the app? Well, you test your changes by running automated tests

![img.png](../img/section-1/0002_1-7.png)

So to solve these issues of conflicting changes and testing code frequently, the rule is that everyone should merge or integrate their changes with the remote repo in
small chunks and frequently. So the code changes get continuously integrated into the main branch(or any branch that devs are working on) which means:
1) **_merged_**, so others can update their local state of code and then
2) **_tested_**, to make sure the changes didn't break anything in the app

and that's what the CI stands for.
![img.png](../img/section-1/0002_1-8.png)

CI: 
- developers continuously integrate their small code changes to the repo
- which then triggers the CI/CD pipeline
![img.png](../img/section-1/0002_1-9.png)

CD:
the process of manual testing and deploying it to the dev environment and all the way to the prod, gives us the complete CI/CD pipeline which is 
either streamlined and fully automated until the development stage, or all the way to the production stage if you enough proper automated test.
![img.png](../img/section-1/0002_1-10.png)
![img.png](../img/section-1/0002_1-11.png)

So CD Is either continuous deployment(fully automated) or continuous delivery(non-automated at the final stages like prod)

## 0003_2_Introduction_to_GitLab_CI_CD
![img.png](../img/section-1/0003_2-1.png)

Let's see how gitlab helps us in this flow.

### source code management
![img.png](../img/section-1/0003_2-2.png)
![img.png](../img/section-1/0003_2-3.png)

### CI/CD platform:
Once a developer merges his code changes, we want to run automated test in order to test those changes and if the tests are successful, maybe
we didn't break anything, then we want to build and deploy the app to the development env and that process is automated and streamlined and
that's where gitlab CI/CD comes in which means you can integrate various /tools for testing and building packaging and deploying your app to the
deployment environments in the gitlab CI/CD and now gitlab actually offers built-in features for things like automated tests, docker registry and ... .

It offers you a platform with various features, so that you can build your CI/CD pipelines.

## 0004_3_How_GitLab_compares_to_other_CI_CD_platforms

### gitlab CI/CD vs jenkins:
The most popular CI/CD tool is jenkins.
![img.png](../img/section-1/0004_3-3.png)

Note: Gitlab is a platform that let's you host your application code.
![img.png](../img/section-1/0004_3-4.png)
![img.png](../img/section-1/0004_3-5.png)

### gitlab CI/CD vs azure pipelines:
Major public cloud providers increased their CI/CD capabilities as well.

![img.png](../img/section-1/0004_3-6.png)
![img.png](../img/section-1/0004_3-7.png)

In gitlab, you can use other docker registries than the gitlab's. On the other hand, azure pipelines does not offer that flexibility for integrating with
other services.

In gitlab, we can combine gitlab managing some of the servers for you and you're attaching additional servers taht you manage yourself.
![img.png](../img/section-1/0004_3-8.png)