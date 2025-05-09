
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

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { saveUserData } from "../services/saveData";
import {
    uploadUserImage,
    deleteUserImage,
    updateUserImageUrl
} from "../services/userImageService";
import { deleteUserDataAndImage, deleteFirebaseAuthUser } from "../services/userDeleteService";


import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';

import { socialM, subs, categories } from "../constants/dataOptions";

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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
    const [isLocation, setIsLocation] = useState(false);
    const [marker, setMarker] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const [img, setImg] = useState(""); // Holds image URL
    const [imgPath, setImgPath] = useState(""); // Firebase Storage path
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const [isDeleting, setIsDeleting] = useState(false);

    const handleSelect = (event, newValue) => {
        if (newValue) {
            console.log('Selected movie:', newValue);
            setSelectedSocialM(newValue);
        }
    };

    const handleSubmit = async () => {
        if (!userEmail) return;

        // Check if location is set
        if (!location) {
            setSnackbarMessage("Location is required.");
            setSnackbarOpen(true);
            return;
        }

        // Validate required fields
        if (!name || !category || !smt) {
            const missingFields = [];
            if (!name) missingFields.push("Name");
            if (!category) missingFields.push("Category");
            if (!smt) missingFields.push("Social Media");

            setSnackbarMessage(`Please fill in: ${missingFields.join(", ")}`);
            setSnackbarOpen(true);
            return;
        }

        try {
            await saveUserData(userEmail, {
                name,
                desc: desc || null, // optional
                category,
                smt,
                location,
                img: img || ""
            });

            setSnackbarMessage("Successfully saved!");
        } catch (error) {
            console.error("Error saving document:", error);
            setSnackbarMessage("Failed to save data.");
        } finally {
            setSnackbarOpen(true);
        }
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

    const handleConfirmDelete = async () => {
        setOpenConfirm(false);
        if (!userEmail) return;

        setIsDeleting(true); // Start dimmed loading

        try {
            await deleteUserDataAndImage(userEmail);
            setSnackbarMessage("User deleted successfully.");
            setName(""); setDesc(""); setCategory(null); setSmt(null); setLocation(null); setImg("");
        } catch (error) {
            console.error("Failed to delete user:", error);
            setSnackbarMessage("Error deleting user.");
        } finally {
            setSnackbarOpen(true);
        }

        try {
            await deleteFirebaseAuthUser();
            setSnackbarMessage("User deleted successfully.");
        } catch (error) {
            console.error("Error deleting user:", error);
            setSnackbarMessage("Failed to delete user.");
        } finally {
            setSnackbarOpen(true);
            setIsDeleting(false); // End loading
        }
    };

    const handleCancelDelete = () => {
        setOpenConfirm(false);
    };

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
                    setImg(data.img || "");

                    if (data.location) {
                        setIsLocation(true)
                    }
                } else {
                    console.log("No data found for this user.");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, [userEmail]);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !userEmail) return;

        setIsUploading(true);

        try {
            // Check if user doc exists
            const docRef = doc(db, "locations", userEmail);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    name: null,
                    desc: null,
                    category: null,
                    smt: null,
                    location: null,
                    img: null,
                });
            }

            // Delete existing image if any
            if (img) {
                const path = decodeURIComponent(new URL(img).pathname.split("/o/")[1].split("?alt=")[0]);
                await deleteUserImage(path);
            }

            // Upload new image
            const { url, path } = await uploadUserImage(file, userEmail);
            await updateUserImageUrl(userEmail, url);

            setImg(url);
            setImgPath(path);

            setSnackbarMessage("Image uploaded");
        } catch (error) {
            console.error("Image change failed:", error);
            setSnackbarMessage("Failed to upload image.");
        } finally {
            setSnackbarOpen(true);
            setIsUploading(false);
        }
    };

    const handleImageDelete = async () => {
        if (!img || !userEmail) return;

        try {
            const path = decodeURIComponent(new URL(img).pathname.split("/o/")[1].split("?alt=")[0]);
            await deleteUserImage(path);
            await updateUserImageUrl(userEmail, "");
            setImg("");
        } catch (error) {
            console.error("Image delete failed:", error);
        } finally {
            setSnackbarMessage("Image deleted");
            setSnackbarOpen(true);
        }
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
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

    // 👇 Add marker after map & location are both ready
    useEffect(() => {
        if (mapRef.current && location) {
            const lng = location.longitude || location.lng?.();  // fallback if needed
            const lat = location.latitude || location.lat?.();

            if (!lng || !lat) return;

            const marker = new maplibregl.Marker()
                .setLngLat([lng, lat])
                .addTo(mapRef.current);

            mapRef.current.flyTo({
                center: [lng, lat],
                zoom: 7,
                essential: true,
            });

            return () => marker.remove();
        }
    }, [location]);

    const handleMarkNewLocation = () => {
        setSnackbarMessage("Click on the new place to change the location.");
        setSnackbarOpen(true);


        if (marker) {
            marker.remove(); // Remove current marker
            setMarker(null);
        }

        setIsDrawing(true);

        const map = mapRef.current;

        const onClick = (e) => {
            const lngLat = e.lngLat;

            // Add new marker
            const newMarker = new maplibregl.Marker().setLngLat(lngLat).addTo(map);
            setMarker(newMarker);

            // Save location
            setLocation({ latitude: lngLat.lat, longitude: lngLat.lng });
            // setLocation(new GeoPoint({ latitude: lngLat.lat, longitude: lngLat.lng }));
            // Deactivate drawing mode
            setIsDrawing(false);

            // Remove click listener
            map.off('click', onClick);

            setIsLocation(true);
        };

        // Add one-time click listener
        map.on('click', onClick);
    };


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

                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <img
                        src={img || "/imgs/default-avatar.jpg"}
                        alt="User"
                        style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    {isUploading && (
                        <div
                            style={{
                                backgroundColor: "rgba(141, 141, 141, 0.5)",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                borderRadius: "5px"
                            }}
                        >
                            Uploading...
                        </div>
                    )}

                    <div style={{ marginTop: "10px" }}>
                        <Button size="small" variant="contained" onClick={() => fileInputRef.current.click()}>Upload</Button>
                        <Button size="small" variant="contained" color="error" onClick={handleImageDelete} style={{ marginLeft: "10px" }}>
                            Delete
                        </Button>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            ref={fileInputRef}
                            onChange={handleImageChange}
                        />
                    </div>
                </div>

                <Divider />

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
                        onChange={(event, newValue) => setCategory(newValue)}
                        renderInput={(params) => <TextField {...params} label="Category" />}
                    />
                </List>
                <Divider />
                {isLocation ? (
                    <Button fullWidth variant='outlined'
                        onClick={handleMarkNewLocation}
                        sx={{ borderRadius: '10px', marginTop: '10px', marginBottom: "10px" }}>
                        <MyLocationIcon sx={{ mr: 1 }} />
                        Change location
                    </Button>
                ) : (
                    <Button fullWidth variant='outlined'
                        onClick={handleMarkNewLocation}
                        sx={{ borderRadius: '10px', marginTop: '10px', marginBottom: "10px" }}>
                        <MyLocationIcon sx={{ mr: 1 }} />
                        Mark the Location
                    </Button>
                )}
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

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    variant="filled"
                    severity="info"
                    sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {isDeleting && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1300 // higher than dialogs/snackbars
                }}>
                    <div style={{ color: '#fff', fontSize: '28px' }}>
                        Deleting user...
                    </div>
                    {/* Or use a spinner */}
                    {/* <CircularProgress color="inherit" /> */}
                </div>
            )}

            <div
                ref={mapContainerRef}
                className="map-container"
            />
        </div>
    )
}

export default EditorComponent