# Idle Game


## What is this?

This is a hobby project with a hope to eventually make a idle clicker game.


## Current State

Currently we are adding 5 "back workers" and 2 "front workers" (added to the middle of the screen, random position).

Random jobs are added every 1.5s
Jobs are X seconds wait at the choosen station (square)

Workers will continously pick up jobs from a queue to execute.

Back workers create product and leave in the middle.
Front workers take the product and deliver it to the waiting area.


## How to run locally

```shell
# install dependencies
npm install

# run the server
npm run dev
```
