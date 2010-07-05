#!/usr/bin/env python

import distutils.core
import sys
# Importing setuptools adds some features like "setup.py develop", but
# it's optional so swallow the error if it's not there.
try:
    import setuptools
except ImportError:
    pass

# Build the epoll extension for Linux systems with Python < 2.6
distutils.core.setup(
    name="tilemill",
    version="0.0",
    packages = ["tilemill"],
    author="Development Seed",
    author_email="support@developmentseed.org",
    url="http://www.mapbox.com/",
    license="http://creativecommons.org/licenses/BSD/",
    description="",
)
