/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package rbsa.eoss.server;


import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Stack;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;

import rbsa.eoss.DrivingFeaturesGenerator;
import rbsa.eoss.DrivingFeature;
import rbsa.eoss.Result;
import rbsa.eoss.ResultCollection;
import rbsa.eoss.ResultManager;
import rbsa.eoss.local.Params;


/**
 *
 * @author Bang
 */
@WebServlet(name = "IFEEDServlet", urlPatterns = {"/IFEEDServlet"})
public class IFEEDServlet extends HttpServlet {
    
	private static final long serialVersionUID = 1257649107469947355L;

	private Gson gson = new Gson();
    ResultManager RM = ResultManager.getInstance();

    private static IFEEDServlet instance=null;
	ServletContext sctxt;
	ServletConfig sconfig;
    
	ArrayList<IFEEDServlet.ArchInfo> architectures;
	rbsa.eoss.DrivingFeaturesGenerator dfsGen;
    
    /**
     *
     * @throws ServletException
     */
    @Override
    public void init() throws ServletException{ 
    	instance = this;
    	
    	sctxt = this.getServletContext();
    	sconfig = this.getServletConfig();
    	architectures = new ArrayList<>();
    }
    /**
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code>
     * methods.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        try (PrintWriter out = response.getWriter()) {
            /* TODO output your page here. You may use following sample code. */
            out.println("<!DOCTYPE html>");
            out.println("<html>");
            out.println("<head>");
            out.println("<title>Servlet IFEEDServlet</title>");            
            out.println("</head>");
            out.println("<body>");
            out.println("<h1>Servlet IFEEDServlet at " + request.getContextPath() + "</h1>");
            out.println("</body>");
            out.println("</html>");
        }
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

//        processRequest(request, response);
    }

    /**
     * Handles the HTTP <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
    	

        String outputString="";
        String requestID = request.getParameter("ID");
        try {
                    	
        if (requestID.equalsIgnoreCase("extractInfoFromBitString")){
            String bitString_string = request.getParameter("bitString");
            int cnt = bitString_string.length();
//            boolean[] bitString = new boolean[cnt];
            int norb = Params.orbit_list.length;
            int ninstr = Params.instrument_list.length;
            ArrayList<instrumentsInOrbit> architecture = new ArrayList<>();
            int b = 0;
            for (int i= 0;i<norb;i++) {
                String orbit = Params.orbit_list[i];
                instrumentsInOrbit thisOrbit = new instrumentsInOrbit(orbit);
                for (int j= 0;j<ninstr;j++) { 
                    if (bitString_string.substring(b,b+1).equalsIgnoreCase("1")){
                        String inst = Params.instrument_list[j];
                        thisOrbit.addToChildren(inst);
                    }
                    b++;
                }
                architecture.add(thisOrbit);
            }
            String jsonObj = gson.toJson(architecture);
            outputString = jsonObj;

        }
        
        else if (requestID.equalsIgnoreCase("import_new_data")){
            String path_input = request.getParameter("filePath");
            String[] paths;
            if(path_input.contains(",")){
            	paths = path_input.split(",");
            }else{
            	paths = new String[1];
            	paths[0] = path_input;
            }
            architectures = new ArrayList<>();
            for(String path:paths){
                InputStream file = sctxt.getResourceAsStream(path);
                ResultCollection RC = RM.loadResultCollectionFromInputStream(file);
                Stack<Result> results = RC.getResults();
                
                int size = architectures.size();
                int id = size;
                for (int i=0;i<results.size();i++){
                	Result resu = results.get(i);
                    if(resu.getScience()>=0.0001){
                        double sci = resu.getScience();
                        double cost = resu.getCost();
                        boolean[] bitString = resu.getArch().getBitString();
                        ArchInfo arch = new ArchInfo(id,sci,cost,bitString);
                        id++;
                        arch.setStatus("originalData");
                          
                        // Remove redundant data
                        boolean foundMatch = false;
                        for(int a=0;a<architectures.size();a++){
                        	boolean match = true;
                        	boolean[] bitString2 = architectures.get(a).bitString;
                        	for(int b=0;b<bitString.length;b++){
                        		if(bitString[b]!=bitString2[b]){
                        			match=false;
                        			break;
                        		}
                        	}
                        	if(match){
                        		foundMatch=true;
                        		break;
                        	}
                        }
                        if(!foundMatch){
                        	architectures.add(arch);                           	
                        }

                    }
                }
            }
            
            String jsonObj = gson.toJson(architectures);
            outputString = jsonObj;
        }
        
        
        else if (requestID.equalsIgnoreCase("getInstrumentList")){
            ArrayList<String> instrumentList = new ArrayList<>(); 
            String[] instruments = Params.instrument_list;
            for (String inst:instruments){
                instrumentList.add(inst);
            }
            String jsonObj = gson.toJson(instrumentList);
            outputString = jsonObj;

        }
        
        else if (requestID.equalsIgnoreCase("getOrbitList")){
            ArrayList<String> orbitList = new ArrayList<>(); 
            String[] orbits = Params.orbit_list;
            for (String orb:orbits){
                orbitList.add(orb);
            }
            String jsonObj = gson.toJson(orbitList);
            outputString = jsonObj;
        }
        

       
        else if(requestID.equalsIgnoreCase("get_driving_features")){
        
            long t0 = System.currentTimeMillis();
        	
            double supp = Double.parseDouble(request.getParameter("supp"));
            double conf = Double.parseDouble(request.getParameter("conf"));
            double lift = Double.parseDouble(request.getParameter("lift")); 
            
            String selected_raw = request.getParameter("selected");
            selected_raw = selected_raw.substring(1, selected_raw.length()-1);
            String[] selected_split = selected_raw.split(",");
            String non_selected_raw = request.getParameter("non_selected");
            non_selected_raw = non_selected_raw.substring(1, non_selected_raw.length()-1);
            String[] non_selected_split = non_selected_raw.split(",");            
                   
            ArrayList<Integer> behavioral = new ArrayList<>();
            ArrayList<Integer> non_behavioral = new ArrayList<>();
            
            for (String selected:selected_split) {
            	int id = Integer.parseInt(selected);
                behavioral.add(id);
            }
            for (String non_selected:non_selected_split) {
            	int id = Integer.parseInt(non_selected);
                non_behavioral.add(id);
            }
            

            dfsGen = new DrivingFeaturesGenerator();
            dfsGen.initialize(behavioral, non_behavioral,architectures,supp,conf,lift);
            
            
            String user_def_features_raw = request.getParameter("userDefFilters");
            user_def_features_raw = user_def_features_raw.substring(1,user_def_features_raw.length()-1);
            String [] user_def_features = user_def_features_raw.split("\",\"");
            
            for(int i=0;i<user_def_features.length;i++){
            	String user_def_feature = user_def_features[i];
            	if(user_def_feature.length()==0){continue;}
            	else{
            		if(user_def_feature.startsWith("\"")) user_def_feature = user_def_feature.substring(1);
            		if(user_def_feature.endsWith("\"")) user_def_feature = user_def_feature.substring(0,user_def_feature.length()-1);
        		}
            	System.out.println(user_def_feature);
            	dfsGen.addUserDefFeature(user_def_feature);
            }

            
            ArrayList<DrivingFeature> DFs;            
            
            try{
            
            String apriori = request.getParameter("apriori");
            System.out.println(apriori);
            
            if(apriori.equalsIgnoreCase("true")){
            	dfsGen.turn_on_apriori();
            }

            DFs = dfsGen.getPrimitiveDrivingFeatures();
            
            Collections.sort(DFs,DrivingFeature.DrivingFeatureComparator);
            String jsonObj = gson.toJson(DFs);
            outputString = jsonObj;
            
            }catch(Exception e){
            	e.printStackTrace();
            }
//        	
            long t1 = System.currentTimeMillis();
            System.out.println( "Feature extraction done in: " + String.valueOf(t1-t0) + " msec");
        }
        
        
        else if (requestID.equalsIgnoreCase("build_classification_tree")){
        	String graph = dfsGen.buildClassificationTree();
        	outputString = graph;
        	System.out.println(outputString);
        }        
        
        
        } catch(Exception e){
            e.printStackTrace();
        }
        
        response.flushBuffer();
        response.setContentType("text/html");
        response.setHeader("Cache-Control", "no-cache");
        response.getWriter().write(outputString);    
        
//        processRequest(request, response);
    }
    
    
    public static IFEEDServlet getInstance()
    {
        if( instance == null ) 
        {
            instance = new IFEEDServlet();
        }
        return instance;
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>
    
    public int[][] bitString2IntMat(String bitString){
        int norb = Params.orbit_list.length;
        int ninstr = Params.instrument_list.length;
        int[][] mat = new int[norb][ninstr];
        int cnt=0;
        for(int i=0;i<norb;i++){
            for(int j=0;j<ninstr;j++){
                if(bitString.substring(cnt, cnt+1).equalsIgnoreCase("1")){
                    mat[i][j]=1;
                }else{
                    mat[i][j]=0;
                }
                cnt++;
            }
        }
        return mat;
    }
    public int[][] boolArray2IntMat(boolean[] bool){
        int norb = Params.orbit_list.length;
        int ninstr = Params.instrument_list.length;
        int[][] mat = new int[norb][ninstr];
        int cnt=0;
        for(int i=0;i<norb;i++){
            for(int j=0;j<ninstr;j++){
                if(bool[cnt]==true){
                    mat[i][j]=1;
                }else{
                    mat[i][j]=0;
                }
                cnt++;
            }
        }
        return mat;
    }
    
    public boolean compareTwoBitStrings(String b1, boolean[] b2){
        for(int i=0;i<b2.length;i++){
            if(b1.substring(i,i+1).equalsIgnoreCase("0") && b2.equals(true)){
                return false;
            } else if (b1.substring(i,i+1).equalsIgnoreCase("1") && b2.equals(false)){
            	return false;
            }
        }
    	return true;
    }
    
    public boolean compareTwoBitStrings(boolean[] b1, boolean[] b2){
        for(int i=0;i<b1.length;i++){
            if(b1[i]!=b2[i]){
                return false;
            }
        }
        return true;
    }
    
    
    class instrumentsInOrbit{
        private String orbit;
        private ArrayList<String> children;
        
        public instrumentsInOrbit(String orbit){
            this.orbit = orbit;
            children = new ArrayList<>();
        }
       public void addToChildren(String instrument){
           children.add(instrument);
       }
       
    }
    
    
    

    public class ArchInfo{
    	private int id;
    	private boolean[] bitString;
    	private int[][] mat;
        private double science;
        private double cost;
        private String status;
        
        public ArchInfo(){
        }
        
        public ArchInfo(int id, double science,double cost, boolean[] bitString){
            this.id = id;
        	this.science = science;
            this.cost = cost;
            this.bitString = bitString;
            this.mat = boolArray2IntMat(bitString);
        }
        public void setStatus(String status){
            this.status=status;
        }
        
        public boolean[] getBitString(){
        	return this.bitString;
        }
        public int getID(){
        	return this.id;
        }
        public int[][] getIntMat(){
        	return this.mat;
        }
    }
    
    
}


        



