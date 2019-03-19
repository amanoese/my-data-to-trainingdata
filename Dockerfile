FROM node

MAINTAINER amanoese

RUN apt-get update && apt-get install -y imagemagick ghostscript poppler-utils

CMD node
