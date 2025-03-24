# Low Fidelity Mockups

Test it out at https://ruediste.github.io/lo-fi-mockups/

The goal of this project is to create a tool for low fidelity UI mockups. The focus is on quickly sketching a UI.

## Current Status

The project is still in it's early stages, far from production ready. The basic architecture is already present, along with some widgets.

## Architecture

There are two model layer: the data layer, for example `ProjectData`, and the domain layer, for example `Project`. The data layer is can be directly serialized as JSON. The domain layer contains all the functionality required for the UI, which is written in React. The domain layer emits events, which are observed by the react components to trigger UI updates.
