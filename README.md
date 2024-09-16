# Idle Game


## What is this?

This is a hobby project with a hope to eventually make a idle clicker game.


## Current State

Currently we are adding 5 "back workers" and 3 "front workers" and 6 "customers".

Customers go to the waiting area and and wait for their orders to be taken.
Front Facing workers take customer orders and relay them to Back workers
Workers will continously pick up jobs from a queue to execute.
Back Workers then create the requested product and places it in the delivery area.
Front workers then pick them up and delivery to the customers
Customers leave when orders are fulfilled.
New Customers come in when old ones leave or spaces empties up!

## How to run locally

```shell
# install dependencies
npm install

# run the server
npm run dev
```
