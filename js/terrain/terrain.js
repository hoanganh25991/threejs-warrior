import * as THREE from 'three';

export default class Terrain {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            width: options.width || 1000,
            height: options.height || 1000,
            segmentsW: options.segmentsW || 100,
            segmentsH: options.segmentsH || 100,
            maxHeight: options.maxHeight || 50,
            minHeight: options.minHeight || -50,
            heightmap: options.heightmap || null,
            textures: {
                diffuse: options.textures?.diffuse || null,
                normal: options.textures?.normal || null,
                displacement: options.textures?.displacement || null,
                specular: options.textures?.specular || null,
                bump: options.textures?.bump || null,
                ao: options.textures?.ao || null,
                light: options.textures?.light || null
            },
            materialOptions: {
                wireframe: options.materialOptions?.wireframe || false,
                flatShading: options.materialOptions?.flatShading || false
            }
        };

        this.geometry = null;
        this.material = null;
        this.mesh = null;

        this.initializeTerrain();
    }

    async initializeTerrain() {
        // Create geometry
        this.geometry = new THREE.PlaneGeometry(
            this.options.width,
            this.options.height,
            this.options.segmentsW,
            this.options.segmentsH
        );
        this.geometry.rotateX(-Math.PI / 2);

        // Load heightmap if provided
        if (this.options.heightmap) {
            await this.loadHeightmap(this.options.heightmap);
        }

        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const loadTexture = async (url) => {
            if (!url) return null;
            return new Promise((resolve) => {
                textureLoader.load(url, (texture) => {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(4, 4);
                    resolve(texture);
                });
            });
        };

        const [
            diffuseMap,
            normalMap,
            displacementMap,
            specularMap,
            bumpMap,
            aoMap,
            lightMap
        ] = await Promise.all([
            loadTexture(this.options.textures.diffuse),
            loadTexture(this.options.textures.normal),
            loadTexture(this.options.textures.displacement),
            loadTexture(this.options.textures.specular),
            loadTexture(this.options.textures.bump),
            loadTexture(this.options.textures.ao),
            loadTexture(this.options.textures.light)
        ]);

        // Create material
        this.material = new THREE.MeshStandardMaterial({
            map: diffuseMap,
            normalMap: normalMap,
            displacementMap: displacementMap,
            displacementScale: 10,
            specularMap: specularMap,
            bumpMap: bumpMap,
            aoMap: aoMap,
            lightMap: lightMap,
            wireframe: this.options.materialOptions.wireframe,
            flatShading: this.options.materialOptions.flatShading,
            side: THREE.DoubleSide
        });

        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        // Update normals and tangents
        this.geometry.computeVertexNormals();
        this.geometry.computeTangents();

        // Set up shadow
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
    }

    async loadHeightmap(url) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;

                const positions = this.geometry.attributes.position.array;
                const vertices = positions.length / 3;

                for (let i = 0; i < vertices; i++) {
                    const x = i % (this.options.segmentsW + 1);
                    const y = Math.floor(i / (this.options.segmentsW + 1));
                    
                    const ix = Math.floor((x / this.options.segmentsW) * (image.width - 1));
                    const iy = Math.floor((y / this.options.segmentsH) * (image.height - 1));
                    
                    const heightValue = imageData[(iy * image.width + ix) * 4] / 255;
                    const height = this.options.minHeight + 
                        (this.options.maxHeight - this.options.minHeight) * heightValue;
                    
                    positions[i * 3 + 1] = height;
                }

                this.geometry.attributes.position.needsUpdate = true;
                this.geometry.computeVertexNormals();
                resolve();
            };
            image.src = url;
        });
    }

    getHeightAt(x, z) {
        if (!this.mesh) return 0;

        const raycaster = new THREE.Raycaster();
        const position = new THREE.Vector3(x, 1000, z);
        raycaster.ray.origin.copy(position);
        raycaster.ray.direction.set(0, -1, 0);

        const intersects = raycaster.intersectObject(this.mesh);
        if (intersects.length > 0) {
            return intersects[0].point.y;
        }
        return 0;
    }

    getNormalAt(x, z) {
        if (!this.mesh) return new THREE.Vector3(0, 1, 0);

        const raycaster = new THREE.Raycaster();
        const position = new THREE.Vector3(x, 1000, z);
        raycaster.ray.origin.copy(position);
        raycaster.ray.direction.set(0, -1, 0);

        const intersects = raycaster.intersectObject(this.mesh);
        if (intersects.length > 0) {
            return intersects[0].face.normal;
        }
        return new THREE.Vector3(0, 1, 0);
    }

    modifyTerrain(position, radius, height, smoothing = true) {
        const positions = this.geometry.attributes.position.array;
        const vertices = positions.length / 3;

        for (let i = 0; i < vertices; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            const vertex = new THREE.Vector3(x, y, z);

            const distance = vertex.distanceTo(position);
            if (distance < radius) {
                const influence = smoothing ? 
                    1 - (distance / radius) * (distance / radius) :
                    1 - distance / radius;
                
                positions[i * 3 + 1] += height * influence;
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }

    update(delta) {
        // Update any animations or dynamic effects
        if (this.material.displacementMap) {
            this.material.displacementMap.offset.x += 0.1 * delta;
            this.material.displacementMap.offset.y += 0.1 * delta;
        }
    }

    dispose() {
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
        
        Object.values(this.options.textures).forEach(texture => {
            if (texture) texture.dispose();
        });
    }
}
