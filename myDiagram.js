var arquivo;
var diferenca;
var savedModel;
//var object = model.create();



function init() {
    var $$ = go.GraphObject.make; // for conciseness in defining templates
    var radgrad = $$(go.Brush, go.Brush.Radial, {
        0: "rgb(240, 240, 240)",
        0.3: "rgb(240, 240, 240)",
        1: "rgba(240, 240, 240, 0)"
    });
    myDiagram =
        $$(go.Diagram, "myDiagramDiv", // must name or refer to the DIV HTML element
            {
                allowDrop: true, // from Palette
                // what to do when a drag-drop occurs in the Diagram's background
                mouseDrop: function(e) {
                    finishDrop(e, null);
                },
                initialContentAlignment: go.Spot.Center,
                // have mouse wheel events zoom in and out instead of scroll up and down
                "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
                // enable Ctrl-Z to undo and Ctrl-Y to redo
                "undoManager.isEnabled": true,
                "commandHandler.archetypeGroupData": {
                    text: "a map",
                    isGroup: true,
                    color: "black",
                    category: "OfNodes"
                },
                "clickCreatingTool.archetypeNodeData": {
                    text: "new node",
                },
            });
    // Define the appearance and behavior for Nodes:

    // First, define the shared context menu for all Nodes, Links, and Groups.

    // To simplify this code we define a function for creating a context menu button:
    function makeButton(text, action, visiblePredicate) {
        return $$("ContextMenuButton",
            $$(go.TextBlock, text), {
                click: action
            },
            // don't bother with binding GraphObject.visible if there's no predicate
            visiblePredicate ? new go.Binding("visible", "", function(o, e) {
                return o.diagram ? visiblePredicate(o, e) : false;
            }).ofObject() : {});
    }
    // a context menu is an Adornment with a bunch of buttons in them
    var partContextMenu =
        $$(go.Adornment, "Vertical",
            makeButton("Properties",
                function(e, obj) { // OBJ is this Button
                    var contextmenu = obj.part; // the Button is in the context menu Adornment
                    var part = contextmenu.adornedPart; // the adornedPart is the Part that the context menu adorns
                    // now can do something with PART, or with its data, or with the Adornment (the context menu)
                    if (part instanceof go.Link) alert(linkInfo(part.data));
                    else if (part instanceof go.Group) alert(groupInfo(contextmenu));
                    else if (part instanceof go.Node) alert(nodeInfo(part.data));
                    else alert(diagramInfo(myDiagram.model))
                }),
            makeButton("Cut",
                function(e, obj) {
                    e.diagram.commandHandler.cutSelection();
                },
                function(o) {
                    return o.diagram.commandHandler.canCutSelection();
                }),
            makeButton("Copy",
                function(e, obj) {
                    e.diagram.commandHandler.copySelection();
                },
                function(o) {
                    return o.diagram.commandHandler.canCopySelection();
                }),
            makeButton("Paste",
                function(e, obj) {
                    e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
                },
                function(o) {
                    return o.diagram.commandHandler.canPasteSelection();
                }),
            makeButton("Delete",
                function(e, obj) {
                    e.diagram.commandHandler.deleteSelection();
                },
                function(o) {
                    return o.diagram.commandHandler.canDeleteSelection();
                }),
            makeButton("Undo",
                function(e, obj) {
                    e.diagram.commandHandler.undo();
                },
                function(o) {
                    return o.diagram.commandHandler.canUndo();
                }),
            makeButton("Redo",
                function(e, obj) {
                    e.diagram.commandHandler.redo();
                },
                function(o) {
                    return o.diagram.commandHandler.canRedo();
                }),
            makeButton("Group",
                function(e, obj) {
                    e.diagram.commandHandler.groupSelection();
                },
                function(o) {
                    return o.diagram.commandHandler.canGroupSelection();
                }),
            makeButton("Ungroup",
                function(e, obj) {
                    e.diagram.commandHandler.ungroupSelection();
                },
                function(o) {
                    return o.diagram.commandHandler.canUngroupSelection();
                })
        );

    function nodeInfo(d) { // Tooltip info for a node data object
        var str = "Node " + d.key + ": " + d.text + "\n";
        if (d.group)
            str += "member of " + d.group;
        else
            str += "top-level node";
        return str;
    }

    // define the Node template
    myDiagram.nodeTemplate =
        $$(go.Node, "Auto", { // dropping on a Node is the same as dropping on its containing Group, even if it's top-level
                mouseDrop: function(e, nod) {
                    finishDrop(e, nod.containingGroup);
                }
            },

            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            // define the node's outer shape, which will surround the TextBlock
            $$(go.Shape, "RoundedRectangle", {
                    fill: $$(go.Brush, "Linear", {
                        0: "rgb(254, 201, 0)",
                        1: "rgb(254, 162, 0)"
                    }),
                    stroke: "black",
                    portId: "",
                    fromLinkable: true,
                    toLinkable: true,
                    fromLinkableSelfNode: true,
                    toLinkableSelfNode: true,
                    fromLinkableDuplicates: true,
                    toLinkableDuplicates: true,
                    //isGroup: false,
                    cursor: "pointer",
                    name: "SHAPE"
                },
                new go.Binding("fill", "color").makeTwoWay()),
            $$(go.TextBlock, {
                    font: "bold 10pt helvetica, bold arial, sans-serif",
                    margin: 4,
                    editable: true,
                    isUnderline: false,
                    name: "TEXTBLOCK"
                },
                new go.Binding("text", "text").makeTwoWay(),
                new go.Binding("font", "font").makeTwoWay(),
                new go.Binding("isUnderline", "underline").makeTwoWay()), { // this tooltip Adornment is shared by all nodes
                toolTip: $$(go.Adornment, "Auto",
                    $$(go.Shape, {
                        fill: "#FFFFCC"
                    }),
                    $$(go.TextBlock, {
                            margin: 4
                        }, // the tooltip shows the result of calling nodeInfo(data)
                        new go.Binding("text", "", nodeInfo))
                ),
                // this context menu Adornment is shared by all nodes
                contextMenu: partContextMenu
            }
        );


    myDiagram.nodeTemplate.selectionAdornmentTemplate =
        $$(go.Adornment, "Spot",
            $$(go.Panel, "Auto",
                $$(go.Shape, {
                    fill: null,
                    stroke: "blue",
                    strokeWidth: 2
                }),
                $$(go.Placeholder)
            ),
            // the button to create a "next" node, at the top-right corner
            $$("Button", {
                    alignment: go.Spot.TopRight,
                    click: addNodeAndLink
                }, // this function is defined below
                $$(go.Shape, "PlusLine", {
                    desiredSize: new go.Size(6, 6)
                })
            ) // end button
        ); // end Adornment

    // clicking the button inserts a new node to the right of the selected node,
    // and adds a link to that new node


    // Define the appearance and behavior for Links:

    function linkInfo(d) { // Tooltip info for a link data object
        return "Link: " + d.text + "\nfrom " + d.from + " to " + d.to;
    }

    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate =
        $$(go.Link, // the whole link panel
            {
                curve: go.Link.Bezier,
                adjusting: go.Link.Stretch,
                reshapable: true,
                relinkableFrom: true,
                relinkableTo: true,
                toShortLength: 3
            },
            new go.Binding("points").makeTwoWay(),
            new go.Binding("curviness", "curviness"),
            $$(go.Shape, // the link shape
                {
                    isPanelMain: true,
                    stroke: "black",
                    strokeWidth: 1.5
                }),
            $$(go.Shape, // the arrowhead
                {
                    toArrow: "standard",
                    stroke: null
                }),
            $$(go.Panel, "Auto",
                $$(go.Shape, // the link shape
                    {
                        fill: radgrad,
                        stroke: null
                    }),
                $$(go.TextBlock, "new relation", // the label
                    {
                        textAlign: "center",
                        editable: true,
                        font: "10pt helvetica, arial, sans-serif",
                        stroke: "black",
                        margin: 4
                    },
                    new go.Binding("text", "text").makeTwoWay(),
                    new go.Binding("font", "font").makeTwoWay())
            ), { // this tooltip Adornment is shared by all links
                toolTip: $$(go.Adornment, "Auto",
                    $$(go.Shape, {
                        fill: "#FFFFCC"
                    }),
                    $$(go.TextBlock, {
                            margin: 4
                        }, // the tooltip shows the result of calling linkInfo(data)
                        new go.Binding("text", "", linkInfo))
                ),
                // the same context menu Adornment is shared by all links
                contextMenu: partContextMenu
            }
        );

    // Define the appearance and behavior for Groups:

    function groupInfo(adornment) { // takes the tooltip or context menu, not a group node data object
        var g = adornment.adornedPart; // get the Group that the tooltip adorns
        var mems = g.memberParts.count;
        var links = 0;
        g.memberParts.each(function(part) {
            if (part instanceof go.Link) links++;
        });
        return "Group " + g.data.key + ": " + g.data.text + "\n" + mems + " members including " + links + " links";
    }


    // this function is used to highlight a Group that the selection may be dropped into
    function highlightGroup(e, grp, show) {
        if (!grp) return;
        e.handled = true;
        if (show) {
            // cannot depend on the grp.diagram.selection in the case of external drag-and-drops;
            // instead depend on the DraggingTool.draggedParts or .copiedParts
            var tool = grp.diagram.toolManager.draggingTool;
            var map = tool.draggedParts || tool.copiedParts; // this is a Map
            // now we can check to see if the Group will accept membership of the dragged Parts
            if (grp.canAddMembers(map.toKeySet())) {
                grp.isHighlighted = true;
                return;
            }
        }
        grp.isHighlighted = false;
    }

    // Upon a drop onto a Group, we try to add the selection as members of the Group.
    // Upon a drop onto the background, or onto a top-level Node, make selection top-level.
    // If this is OK, we're done; otherwise we cancel the operation to rollback everything.
    function finishDrop(e, grp) {
        var ok = (grp !== null ?
            grp.addMembers(grp.diagram.selection, true) :
            e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true));
        if (!ok) e.diagram.currentTool.doCancel();
    }



    myDiagram.groupTemplateMap.add("OfNodes",
        $$(go.Group, "Auto", {
                background: "transparent",
                ungroupable: true,
                // highlight when dragging into the Group
                mouseDragEnter: function(e, grp, prev) {
                    highlightGroup(e, grp, true);
                },
                mouseDragLeave: function(e, grp, next) {
                    highlightGroup(e, grp, false);
                },
                isSubGraphExpanded: true,
                computesBoundsAfterDrag: false,
                // when the selection is dropped into a Group, add the selected Parts into that Group;
                // if it fails, cancel the tool, rolling back any changes
                mouseDrop: finishDrop,
                handlesDragDropForMembers: true // don't need to define handlers on member Nodes and Links
                    // Groups containing Nodes lay out their members vertically

            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("isSubGraphExpanded").makeTwoWay(),
            new go.Binding("background", "isHighlighted", function(h) {
                return h ? "rgba(255,195,0,0.2)" : "transparent";
            }).ofObject(),
            $$(go.Shape, "RoundedRectangle", {
                fill: null,
                stroke: "black",
                cursor: "pointer",
                fromLinkable: true,
                toLinkable: true,
                fromLinkableSelfNode: true,
                toLinkableSelfNode: true,
                fromLinkableDuplicates: true,
                toLinkableDuplicates: true,
                portId: ""
            }),
            $$(go.Panel, "Vertical", // title above Placeholder
                $$(go.Panel, "Horizontal", // button next to TextBlock
                    {
                        stretch: go.GraphObject.Horizontal,
                        background: $$(go.Brush, "Linear", {
                            0: "rgb(254, 201, 0)",
                            1: "rgb(254, 162, 0)"
                        }),
                    },
                    $$("SubGraphExpanderButton", {
                        alignment: go.Spot.Right,
                        margin: 5
                    }),
                    $$(go.TextBlock, {
                            alignment: go.Spot.Left,
                            editable: true,
                            margin: 5,
                            font: "bold 10pt helvetica, bold arial, sans-serif",
                            stroke: "black"
                        },
                        new go.Binding("text", "text").makeTwoWay())
                ), // end Horizontal Panel
                $$(go.Placeholder, {
                    padding: 0,
                    alignment: go.Spot.TopLeft
                })
            ), // end Vertical Panel
            { // this tooltip Adornment is shared by all links
                toolTip: $$(go.Adornment, "Auto",
                    $$(go.Shape, {
                        fill: "#FFFFCC"
                    }),
                    $$(go.TextBlock, {
                            margin: 4
                        }, // the tooltip shows the result of calling linkInfo(data)
                        new go.Binding("text", "text", function(s) {
                            return "Group: " + s;
                        }))
                ),
                // the same context menu Adornment is shared by all links
                contextMenu: partContextMenu
            }
        )); // end Group and call to add to template Map
    // Define the behavior for the Diagram background:

    function diagramInfo(model) { // Tooltip info for the diagram's model
        return "Model:\n" + model.nodeDataArray.length + " nodes, " + model.linkDataArray.length + " links";
    }

    // provide a tooltip for the background of the Diagram, when not over any Part
    myDiagram.toolTip =
        $$(go.Adornment, "Auto",
            $$(go.Shape, {
                fill: "#FFFFCC"
            }),
            $$(go.TextBlock, {
                    margin: 4
                },
                new go.Binding("text", "", diagramInfo))
        );

    // provide a context menu for the background of the Diagram, when not over any Part
    myDiagram.contextMenu =
        $$(go.Adornment, "Vertical",
            makeButton("Properties",
                function(e, obj) { // OBJ is this Button
                    var contextmenu = obj.part; // the Button is in the context menu Adornment
                    var part = contextmenu.adornedPart; // the adornedPart is the Part that the context menu adorns
                    // now can do something with PART, or with its data, or with the Adornment (the context menu)
                    if (part instanceof go.Link) alert(linkInfo(part.data));
                    else if (part instanceof go.Group) alert(groupInfo(contextmenu));
                    else if (part instanceof go.Node) alert(nodeInfo(part.data));
                    else alert(diagramInfo(myDiagram.model))
                }),
            makeButton("Paste",
                function(e, obj) {
                    e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
                },
                function(o) {
                    return o.diagram.commandHandler.canPasteSelection();
                }),
            makeButton("Undo",
                function(e, obj) {
                    e.diagram.commandHandler.undo();
                },
                function(o) {
                    return o.diagram.commandHandler.canUndo();
                }),
            makeButton("Redo",
                function(e, obj) {
                    e.diagram.commandHandler.redo();
                },
                function(o) {
                    return o.diagram.commandHandler.canRedo();
                })
        );

    function addNodeAndLink(e, obj) {
        var adorn = obj.part;
        if (adorn === null) return;
        e.handled = true;
        var diagram = adorn.diagram;
        diagram.startTransaction("Add State");
        // get the node data for which the user clicked the button
        var fromNode = adorn.adornedPart;
        var fromData = fromNode.data;
        // create a new "State" data object, positioned off to the right of the adorned Node
        var toData = {
            text: "new node"
        };
        var p = fromNode.location;
        toData.loc = p.x + 200 + " " + p.y; // the "loc" property is a string, not a Point object
        // add the new node data to the model
        var model = diagram.model;
        model.addNodeData(toData);
        // create a link data from the old node data to the new node data
        var linkdata = {};
        linkdata[model.linkFromKeyProperty] = model.getKeyForNodeData(fromData);
        linkdata[model.linkToKeyProperty] = model.getKeyForNodeData(toData);
        // and add the link data to the model
        model.addLinkData(linkdata);
        // select the new Node
        var newnode = diagram.findNodeForData(toData);
        diagram.select(newnode);
        diagram.commitTransaction("Add State");
    }
    myDiagram.model.nodeKeyProperty = "id";
    myDiagram.model.linkKeyProperty = "id";
    myDiagram.model.makeUniqueKeyFunction = function(model, data) {
        var i = model.nodeDataArray.length * 2 + 1;
        while (model.findNodeDataForKey(i) !== null) i += 2;
        data.id = i; // assume Model.nodeKeyProperty === "id"
        return i;
    };
    // link data id's are even numbers
    myDiagram.model.makeUniqueLinkKeyFunction = function(model, data) {
        var i = model.linkDataArray.length * 2 + 2;
        while (model.findLinkDataForKey(i) !== null) i += 2;
        data.id = i; // assume GraphLinksModel.linkKeyProperty === "id"
        return i;
    };



}