import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import { Button } from '@mui/material';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';

import { socialM, subs, categories } from "../constants/dataOptions";

import { fetchAllUsers } from "../services/firestoreService";

const ViewerComponent = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [open, setOpen] = React.useState(false);
    const [users, setUsers] = useState([]);

    const toggleDrawer = (newOpen) => () => {
        setOpen(newOpen);
    };

    const handleSelect = (event, newValue) => {
        if (newValue) {
            setSelectedMovie(newValue);
        }
    };

    const handleSubmit = () => {
        setOpen(false);
    };

    useEffect(() => {
        fetchAllUsers().then(setUsers);
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://demotiles.maplibre.org/style.json", // Free open-source style
            center: [25.4858, 42.7339], // Centered on Bulgaria
            zoom: 6,
        });

        mapRef.current = map;

        // Add zoom and rotation controls
        map.addControl(new maplibregl.NavigationControl(), "top-right");

        return () => map.remove();
    }, []);


    useEffect(() => {
        const map = mapRef.current;
        if (!map || users.length === 0) return;

        const geojson = {
            type: "FeatureCollection",
            features: users.map((user, index) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [
                        user.location.longitude || user.location._long,
                        user.location.latitude || user.location._lat,
                    ],
                },
                properties: {
                    id: user.id || index,
                    name: user.name,
                    photo: user.img,
                    desc: user.desc,
                    smt: user.smt,
                    category: user.category,
                    contact: user.contact
                },
            })),
        };

        // Remove existing source and layers if they exist
        if (map.getSource("users")) {
            map.removeLayer("clusters");
            map.removeLayer("cluster-count");
            map.removeSource("users");
        }

        map.addSource("users", {
            type: "geojson",
            data: geojson,
            cluster: true,
            clusterRadius: 50,
            clusterMaxZoom: 14,
        });

        // Add cluster layer
        map.addLayer({
            id: "clusters",
            type: "circle",
            source: "users",
            filter: ["has", "point_count"],
            paint: {
                "circle-color": "#00BCD4",
                "circle-radius": [
                    "step",
                    ["get", "point_count"],
                    20, 10, 30, 50, 40
                ],
                "circle-stroke-width": 2,
                "circle-stroke-color": "#fff"
            }
        });

        // Add cluster label
        map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "users",
            filter: ["has", "point_count"],
            layout: {
                "text-field": "{point_count_abbreviated}",
                "text-size": 12,

            },
        });

        // Clean up previous markers
        const markerElements = [];

        function updateMarkers() {
            // Fully remove old markers
            while (markerElements.length) {
                const m = markerElements.pop();
                m.remove();
            }

            const features = map.querySourceFeatures("users", {
                sourceLayer: "users",
            });

            const nonClustered = features.filter(f => !f.properties.point_count);

            nonClustered.forEach(f => {
                const { coordinates } = f.geometry;
                const { name, photo, desc, category, smt, contact } = f.properties;

                const el = document.createElement("div");
                el.style.backgroundImage = `url(${photo})`;
                el.style.width = "50px";
                el.style.height = "50px";
                el.style.backgroundSize = "cover";
                el.style.borderRadius = "50%";
                el.style.border = "2px solid white";
                el.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";

                const popupHTML = `
                <div style="
                  max-width: 200px;
                  font-family: 'Roboto', sans-serif;
                  border-radius: 8px;
                  overflow: hidden
                  background: #fff;
                  color: #333;
                ">
                  <img 
                    src="${photo}" 
                    alt="${name}" 
                    style="width: 100%; height: auto; object-fit: cover; border-radius: 10px;" 
                  />
                  <div style="padding: 11px;">
                    <h3 style="margin: 0 0 8px; font-size: 16px;">${name}</h3>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>Social Media:</strong> ${smt}</p>
                    <p style="margin: 4px 0; font-size: 12px;  "><strong>Category:</strong> ${category}</p>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>Contact:</strong> ${contact}</p>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>About:</strong> ${desc}</p>
                    
                  </div>
                </div>
              `;

                const popup = new maplibregl.Popup({
                    offset: 25,
                    closeOnClick: true,
                    closeButton: false,


                }).setHTML(popupHTML);

                const hoverPopup = new maplibregl.Popup({
                    offset: 25,
                    closeButton: false,
                    closeOnClick: true,
                    closeOnMove: true,
                });

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat(coordinates)
                    .setPopup(popup)
                    .addTo(map); // Add first without popup

                // Show name-only popup on hover
                el.addEventListener("mouseenter", () => {
                    hoverPopup
                        .setLngLat(coordinates)
                        .setHTML(`<strong>${name}</strong>`)
                        .addTo(mapRef.current);
                });

                el.addEventListener("mouseleave", () => {
                    hoverPopup.remove();
                });


                markerElements.push(marker);
            });
        }

        map.on("moveend", updateMarkers);

        // After geojson is created
        const coordinates = geojson.features.map(f => f.geometry.coordinates);

        // Only zoom if there are valid coordinates
        if (coordinates.length > 0) {
            const bounds = coordinates.reduce((b, coord) => b.extend(coord), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
            map.fitBounds(bounds, { padding: 150, maxZoom: 12 }); // Adjust padding and maxZoom as needed
        }

        return () => {
            map.off("moveend", updateMarkers);
            markerElements.forEach(m => m.remove());
        };
    }, [users]);


    const DrawerList = (
        <Box sx={{ width: 250 }} role="presentation" >
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: '600', padding: '20px', }}>
                Filter Results
            </Typography>
            <List>
                <Autocomplete
                    disablePortal
                    options={socialM}
                    sx={{ padding: '10px' }}
                    size="small"
                    renderInput={(params) => <TextField {...params} label="Social Media" />}
                    placeholder="Select a Social Media Type"
                    getOptionLabel={(option) => option.label}
                    onChange={handleSelect}

                />

                <Autocomplete
                    disablePortal
                    options={subs}
                    // onChange={handleSecondSelect}
                    size="small"
                    sx={{ padding: '10px' }}
                    renderInput={(params) => <TextField {...params} label="Subscribers/ followers" />}
                />


                {/* Category Filter - added new */}
                <Autocomplete
                    disablePortal
                    options={categories}
                    sx={{ padding: '10px' }}
                    size="small"
                    renderInput={(params) => <TextField {...params} label="Category" />}
                    onChange={(event, value) => console.log("Selected category:", value)}
                />

            </List>
            <Divider />

            <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ width: '90%', marginLeft: '10px', alignItems: 'center', marginTop: '10px' }} >Apply</Button>
        </Box>
    );


    return (
        <div className="viewer-container">
            <div className="header-container">
                <Box position={"relative"} zIndex={999} sx={{ flexGrow: 1, }} >

                    <AppBar position="static"  >
                        <Toolbar className='header-content' sx={{ bgcolor: 'white', }}>
                            <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="open drawer"
                                sx={{ mr: 2, display: { xs: 'block', sm: 'none' } }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography
                                variant="h5"
                                noWrap
                                component="div"
                                color="primary.main"
                                sx={{ flexGrow: 1, fontWeight: '600', display: { xs: 'none', sm: 'block' } }}
                            >
                                Намери творци
                            </Typography>
                            <div className="search">
                                <div className="search-icon-wrapper">
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    className="styled-input-base"
                                    placeholder="Търси създател по име"
                                    aria-label="search"
                                    style={{ marginLeft: '10px', color: "primary.main" }}
                                />
                            </div>

                            {/* filter */}
                            <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="open drawer"
                                sx={{ ml: 2, }}
                                onClick={toggleDrawer(true)}
                            >
                                <TuneIcon sx={{ color: "primary.main" }} />
                            </IconButton>
                        </Toolbar>

                    </AppBar>
                </Box>
            </div>
            <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
                {DrawerList}
            </Drawer>
            <div
                ref={mapContainerRef}
                className="map-container"
            />
        </div>

    );
};

export default ViewerComponent;

