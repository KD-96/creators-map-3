/**
 * todo: search locations
 * todo: display if location avilabel
 * todo: marke/ edit location : active drag marker
 *      todo: delete marker
 *      todo: if no marker : add new point
 */

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Chip, Button } from '@mui/material';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';

import MenuIcon from '@mui/icons-material/Menu';
import MyLocationIcon from '@mui/icons-material/MyLocation';

import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';

import { socialM, subs, categories } from "../constants/dataOptions";

const EditorComponent = ({ userEmail }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [tags, setTags] = useState([]);

    const [selectedSocialM, setSelectedSocialM] = React.useState(null);

    const [openConfirm, setOpenConfirm] = useState(false);

    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [category, setCategory] = useState(null);
    const [smt, setSmt] = useState(null);
    const [location, setLocation] = useState(null);

    const handleSelect = (event, newValue) => {
        if (newValue) {
            console.log('Selected movie:', newValue);
            setSelectedSocialM(newValue);
        }
    };

    const handleSubmit = () => {

    };

    const handleDelete = () => {
        setOpenConfirm(true);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && event.target.value) {
            event.preventDefault();
            const value = event.target.value.trim();
            if (value && !tags.includes(value) && tags.length < 5) {
                setTags([...tags, value]);
            }
        }
    };

    const handleConfirmDelete = () => {
        setOpenConfirm(false);
        // Proceed with deletion logic
        console.log("Item deleted!");
    };

    const handleCancelDelete = () => {
        setOpenConfirm(false);
    };

    console.log(userEmail);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userEmail) return;

            try {
                const docRef = doc(db, "locations", userEmail);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setName(data.name || "");
                    setDesc(data.desc || "");
                    setCategory(data.category || null);
                    setSmt(data.smt || null);
                    setLocation(data.location || null);
                } else {
                    console.log("No data found for this user.");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, [userEmail]);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://demotiles.maplibre.org/style.json", // Free open-source style
            center: [25.4858, 42.7339], // Centered on Bulgaria
            zoom: 6,
        });

        map.on('style.load', () => {
            map.setProjection({
                type: 'globe', // Set projection to globe
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
                maplibregl
            }), "top-left"
        );

        map.addControl(new maplibregl.FullscreenControl(), "top-left");

        // Add zoom and rotation controls
        map.addControl(new maplibregl.NavigationControl(), "top-left");

        return () => map.remove();
    }, []);


    return (
        <div className="editor-container">
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
                                <MenuIcon color="primary.main" />
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
                        </Toolbar>
                    </AppBar>
                </Box>
            </div>

            <Box className='edit-page-form' sx={{ borderRadius: "10px", bgcolor: "white", boxShadow: 3 }}  >
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: '600', marginBottom: 1 }}>
                    Editor Panel
                </Typography>

                <Typography color="background.light" fontSize={10} fontStyle={'italic'} variant="subtitle2">
                    *Your data will save under <strong>{userEmail}</strong>
                </Typography>
                <List>
                    <TextField
                        className='input-field-1'
                        fullWidth size='small'
                        id="outlined-basic"
                        label="Name"
                        placeholder='Name on the map'
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <TextField
                        className='input-field-1'
                        fullWidth
                        size="small"
                        sx={{ marginTop: '10px', }}
                        id="outlined-multiline-static"
                        label="Description"
                        multiline
                        rows={3}
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                    />
                </List>
                <Divider />
                <List >
                    <Autocomplete
                        className='input-field-1'
                        disablePortal
                        options={socialM}
                        size="small"
                        value={smt}
                        onChange={(event, newValue) => setSmt(newValue)}
                        renderInput={(params) => <TextField {...params} label="Social Media Type" />}
                    />

                    {selectedSocialM && (
                        <Autocomplete
                            className='input-field-1'
                            disablePortal
                            options={subs}
                            // onChange={handleSecondSelect}
                            size="small"
                            sx={{ marginTop: '10px' }}
                            renderInput={(params) => <TextField {...params} label="Sub Option" />}
                        />
                    )}

                </List>
                <Divider />
                <List>
                    {/* <Autocomplete
                        className='input-field-1'
                        multiple
                        freeSolo
                        filterSelectedOptions
                        options={[]} // no dropdown options
                        value={tags}
                        onChange={(event, newValue) => {
                            // prevent more than 5 tags
                            if (newValue.length <= 5) {
                                setTags(newValue);
                            }
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    variant="outlined"
                                    label={option}
                                    {...getTagProps({ index })}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Add up to 5 tags"
                                onKeyDown={handleKeyDown}
                            />
                        )}
                    /> */}

                    <Autocomplete
                        className='input-field-1'
                        disablePortal
                        options={categories}
                        size="small"
                        value={category}
                        onChange={(event, newValue) => setSmt(newValue)}
                        renderInput={(params) => <TextField {...params} label="Category" />}
                    />
                </List>
                <Divider />
                <Button fullWidth variant='outlined' sx={{ borderRadius: '10px', marginTop: '10px', marginBottom: "10px" }}>
                    <MyLocationIcon sx={{ mr: 1 }} />
                    Mark the Location
                </Button>
                <Divider />

                <Button fullWidth onClick={handleSubmit} variant="contained" color="primary" sx={{ alignItems: 'center', marginTop: '10px', borderRadius: '10px' }} >Save</Button>
                <Button fullWidth onClick={handleDelete} variant="contained" color="error" sx={{ alignItems: 'center', marginTop: '10px', borderRadius: '10px' }} >Delete Member</Button>
            </Box >

            <Dialog
                open={openConfirm}
                onClose={handleCancelDelete}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText textAlign={'center'}>
                        Are you sure you want to delete this member from the map? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant='outlined' onClick={handleCancelDelete} color="primary">
                        Cancel
                    </Button>
                    <Button variant='contained' onClick={handleConfirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <div
                ref={mapContainerRef}
                className="map-container"
            />
        </div>
    )
}

export default EditorComponent