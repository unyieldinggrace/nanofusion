class NanoPoWGenerator {

	// TODO: replace this with an implementation that uses WebGL shaders in the browser to distribute the load among
	//  mix clients. See: https://github.com/numtel/nano-webgl-pow
	async GenerateWork(frontierBlockHashOrAccountPublicKey) {
		throw new Error('Not yet implemented.');
	}

}

export default NanoPoWGenerator;
