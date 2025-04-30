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
        if (!mapRef.current || users.length === 0) return;

        users.forEach(user => {
            const el = document.createElement("div");
            el.style.backgroundImage = `url(${user.img})`;
            el.style.width = "50px";  // Adjust size as needed
            el.style.height = "50px"; // Adjust size as needed
            el.style.backgroundSize = "cover";
            el.style.borderRadius = "50%";  // Makes the div circular
            el.style.border = "2px solid white";  // Optional border for contrast
            el.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";

            const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
                `<strong>${user.name}</strong>`
            );

            // Safely extract lat/lng from GeoPoint
            const lat = user.location.latitude || user.location._lat;
            const lng = user.location.longitude || user.location._long;

            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                console.warn("Invalid location for user:", user);
                return;
            }

            new maplibregl.Marker({ element: el })
                .setLngLat([lng, lat])  // MapLibre expects [lng, lat]
                .setPopup(popup)
                .addTo(mapRef.current);
        });
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

