import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';

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
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const [selectedSocialMedia, setSelectedSocialMedia] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filteredUsers, setFilteredUsers] = useState([]);

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

        const filtered = users.filter(user => {
            const matchSocial = selectedSocialMedia ? user.smt === selectedSocialMedia.label : true;
            const matchCategory = selectedCategory ? user.category === selectedCategory.label : true;
            return matchSocial && matchCategory;
        });

        setFilteredUsers(filtered);
    };

    useEffect(() => {
        fetchAllUsers().then(setUsers);
    }, []);



    const handleSearch = () => {
        const user = users.find(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (user && mapRef.current) {
            const coords = [
                user.location.longitude || user.location._long,
                user.location.latitude || user.location._lat,
            ];

            mapRef.current.flyTo({
                center: coords,
                zoom: 8,
                speed: 1.2,
            });
        }
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://tiles.stadiamaps.com/styles/osm_bright.json",
            // style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
            // style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            // style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",

            center: [25.4858, 42.7339], // Centered on Bulgaria

            maxZoom: 10,
        });

        map.on('style.load', () => {
            map.setProjection({
                type: 'globe',
            });
        });

        mapRef.current = map;

        const geocoderApi = {
            forwardGeocode: async (config) => {
                const features = [];
                try {
                    const request =
                        `https://nominatim.openstreetmap.org/search?q=${config.query
                        }&format=geojson&polygon_geojson=1&addressdetails=1`;
                    const response = await fetch(request);
                    const geojson = await response.json();
                    for (const feature of geojson.features) {
                        const center = [
                            feature.bbox[0] +
                            (feature.bbox[2] - feature.bbox[0]) / 2,
                            feature.bbox[1] +
                            (feature.bbox[3] - feature.bbox[1]) / 2
                        ];
                        const point = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: center
                            },
                            place_name: feature.properties.display_name,
                            properties: feature.properties,
                            text: feature.properties.display_name,
                            place_type: ['place'],
                            center
                        };
                        features.push(point);
                    }
                } catch (e) {
                    console.error(`Failed to forwardGeocode with error: ${e}`);
                }

                return {
                    features
                };
            }
        };
        map.addControl(
            new MaplibreGeocoder(geocoderApi, {
                maplibregl,
                placeholder: "Search for a location..."
            }), "top-left"
        );

        // Add zoom and rotation controls
        map.addControl(new maplibregl.NavigationControl(), "top-right");

        return () => map.remove();
    }, []);


    useEffect(() => {
        const map = mapRef.current;
        if (!map || users.length === 0) return;

        const activeUsers = filteredUsers.length > 0 ? filteredUsers : users;

        const geojson = {
            type: "FeatureCollection",
            features: activeUsers.map((user, index) => ({
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
            clusterRadius: 40,
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

                const imageUrl = photo ? photo : "/imgs/default-avatar.jpg";

                const el = document.createElement("div");
                el.style.backgroundImage = `url(${imageUrl})`;
                el.style.width = "50px";
                el.style.height = "50px";
                el.style.backgroundSize = "cover";
                el.style.borderRadius = "50%";
                el.style.border = "2px solid white";
                el.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";

                const popupHTML = `
                <div style="
                  max-width: 280px;
                  font-family: 'Roboto', sans-serif;
                  overflow: hidden;
                  background: #fff;
                  color: #333;
                  padding: 16px;
                ">
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <img 
                      src="${photo}" 
                      alt="${name}" 
                      style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 12px;" 
                    />
                    <div>
                      <div style="font-size: 16px; font-weight: 600;">${name}</div>
                      <div style="
                        display: inline-block;
                        background: #e0f2f1;
                        color: #00796b;
                        font-size: 12px;
                        padding: 2px 8px;
                        border-radius: 12px;
                        margin-top: 4px;
                      ">${category}</div>
                    </div>
                  </div>
              
                  <div style="font-size: 13px; margin-bottom: 8px;">
                    <strong>Social Media:</strong> ${smt}
                  </div>
              
                  <div style="font-size: 13px; margin-bottom: 8px; display: flex; align-items: center;">
                    <svg style="width: 16px; height: 16px; margin-right: 6px;" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79a15.91 15.91 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21 11.72 11.72 0 003.67.58 1 1 0 011 1v3.17a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1h3.17a1 1 0 011 1 11.72 11.72 0 00.58 3.67 1 1 0 01-.21 1.11l-2.2 2.2z"/>
                    </svg>
                    ${contact}
                  </div>
              
                  <div style="font-size: 13px; line-height: 1.5; color: #555;">
                    <strong>About:</strong><br/>
                    ${desc}
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
            map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 3000 }); // Adjust padding and maxZoom as needed
        }

        return () => {
            map.off("moveend", updateMarkers);
            markerElements.forEach(m => m.remove());
        };
    }, [users, filteredUsers]);

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
                    onChange={(event, value) => setSelectedSocialMedia(value)}
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
                    onChange={(event, value) => setSelectedCategory(value)}

                />

            </List>
            <Divider />

            <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ width: '90%', marginLeft: '10px', alignItems: 'center', marginTop: '10px' }} >Apply</Button>
            <Button
                onClick={() => {
                    setSelectedSocialMedia(null);
                    setSelectedCategory(null);
                    setFilteredUsers([]);
                }}
                variant="outlined"
                color="secondary"
                sx={{ width: '90%', marginLeft: '10px', marginTop: '10px' }}
            >
                Clear Filters
            </Button>
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
                                    <SearchIcon onClick={handleSearch} style={{ cursor: "pointer" }} />
                                </div>
                                <input
                                    type="text"
                                    className="styled-input-base"
                                    placeholder="Търси създател по име"
                                    aria-label="search"
                                    value={searchTerm}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setSearchTerm(value);
                                        if (value.trim() === "") {
                                            setSuggestions([]);
                                        } else {
                                            const matches = users.filter(u =>
                                                u.name && u.name.toLowerCase().includes(value.toLowerCase())
                                            );
                                            setSuggestions(matches);
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") handleSearch();
                                    }}
                                    style={{ marginLeft: '10px', color: "primary.main" }}
                                />
                            </div>
                            {suggestions.length > 0 && (
                                <div className="suggestions-list" style={{
                                    position: "absolute",
                                    top: "70px",
                                    right: "90px",
                                    background: "white",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    zIndex: 10,
                                    width: "30%",
                                    borderRadius: 4,
                                    marginTop: 4,
                                    maxHeight: 200,
                                    overflowY: "auto"
                                }}>
                                    {suggestions.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => {
                                                const coords = [
                                                    user.location.longitude || user.location._long,
                                                    user.location.latitude || user.location._lat,
                                                ];
                                                mapRef.current.flyTo({ center: coords, zoom: 14 });
                                                setSearchTerm(user.name);
                                                setSuggestions([]); // Hide after selection
                                            }}
                                            style={{
                                                padding: "8px 12px",
                                                cursor: "pointer",
                                                borderBottom: "1px solid #eee",
                                                color: "black"
                                            }}
                                        >
                                            {user.name}
                                        </div>
                                    ))}
                                </div>
                            )}

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

