# Low Fidelity Mockups

Test it out at https://ruediste.github.io/lo-fi-mockups/

The goal of this project is to create a tool for low fidelity UI mockups. The focus is on quickly sketching a UI.

## Current Status

The project is still in it's early stages, far from production ready. The basic architecture is already present, along with some widgets.

## Architecture

There are two model layer: the data layer, for example `ProjectData`, and the domain layer, for example `Project`. The data layer is can be directly serialized as JSON. The domain layer contains all the functionality required for the UI, which is written in React. The domain layer emits events, which are observed by the react components to trigger UI updates.

## Snapping

When moving elements on the page, they snap to each other. There are three snapping types: edge snapping, margin snapping and middle snapping. For each snapping type, the elements create snap boxes and snap references. The snap boxes have a certain size. While moving, the boxes of the stationary elements are matched against the snap references of the moving elements.

Edge snapping means that each element generates snapping boxes at it's edges, going out from the edges. When an element is moved, it's edges snap to those lines.

For margin snapping, each element creates snap boxes with a distance (margin) from it's edges. The snap references of the moving elements snaps are placed identical to the snap boxes.

For middle snapping, elements provide a snap box through their middle, which expands outside of the element. The snap reference is contained within the element.
