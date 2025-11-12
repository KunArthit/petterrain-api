#!/usr/bin/env bash

docker buildx build . -t your_username/booking-api:0.0.1 --platform linux/amd64
docker push your_username/booking-api:0.0.1