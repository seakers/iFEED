/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package rbsa.eoss.server;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.channels.Channels;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;
import java.util.Random;
import java.util.Stack;

import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

//import org.codemonkey.simplejavamail.email.*;
//import org.codemonkey.simplejavamail.*;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
//import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.Base64;
import com.google.api.services.gmail.Gmail;

import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.*;
import static com.googlecode.objectify.ObjectifyService.ofy;


import rbsa.eoss.Result;
import rbsa.eoss.ResultCollection;
import rbsa.eoss.server.IFEEDServlet.ArchInfo;


//import com.google.api.client.json.jackson2.JacksonFactory;
//import com.google.api.client.http.javanet.NetHttpTransport;


//import madkitdemo3.AgentEvaluationCounter;


/**
 *
 * @author Bang
 */
public class LoginServlet extends HttpServlet {
	
	double time_given = 1 * 30 * 60 * 1000;

    private String CLIENT_ID = "564804694787-lnsp9md3u0q8086nftbamu43drid6d4t.apps.googleusercontent.com";
    private String[] CLIENT_ID_List = new String[1];
    
    private static LoginServlet instance=null;
	

	
    @Override
    public void init() throws ServletException{ 
    	instance = this;
    	CLIENT_ID_List[0] = CLIENT_ID;
    	ObjectifyService.register(Experiment_2016_12.class);
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
            out.println("<title>Servlet jessCommandServlet</title>");            
            out.println("</head>");
            out.println("<body>");
            out.println("<h1>Servlet jessCommandServlet at " + request.getContextPath() + "</h1>");
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
    	
    	

        String requestID = request.getParameter("ID");
        String outputString = "";
        
        

    	if (requestID.equalsIgnoreCase("login")){
                
	    	boolean accessGranted = false;
	        
	        System.out.println("----- Login -----");
	        String account_id = request.getParameter("account_id");
	        String testType = request.getParameter("testType");
	        String loginTime = request.getParameter("loginTime");
	        
	        
        	Experiment_2016_12 acc = ofy().load().type(Experiment_2016_12.class).filter("accountID",account_id).first().now();
        	
	        if(acc!=null){
	        
		        	String originalStartTime = acc.getLoginTime();
	            	
	            	double timeDiff_milisec = Double.parseDouble(loginTime) - Double.parseDouble(originalStartTime);
	            	double timeDiff_sec = (double) ((double)timeDiff_milisec) / ((double)1000.0);	            	
	            	double remaining_time = time_given - timeDiff_milisec;
	            	outputString = Double.toString(remaining_time);
	            	
	            	int n = acc.getLoginTrial();
	            	acc.setLoginTrial(n+1);
	            	ofy().save().entity(acc);
	            	
	            	if(remaining_time < 0){
	            		accessGranted=false;
	            	}else{
	            		accessGranted=true;
	            	}
	            	
	        } else{   // logging in for the first time

	        		if(account_id.substring(account_id.length()-12).equalsIgnoreCase("717038028138")){
		            	double remaining_time = time_given;
		            	outputString = Double.toString(remaining_time);
		                
		            	//saving the account info in the database
		            	Experiment_2016_12 a1 = new Experiment_2016_12();
		            	
		            	a1.setAccountID(account_id);
		    	        a1.setLoginTime(loginTime);
		    	        a1.setType(testType);
		    	        a1.setLoginTrial(1);
		    	        ofy().save().entity(a1);
		           
		    	        accessGranted=true;
	        		} else{
	        			accessGranted=false;
	        		} 
	        } 
	        
	        
	        if(!accessGranted){
	        	outputString="accessDenied";
	        }

    	} 
    	
    	if (requestID.equalsIgnoreCase("sessionTimeout")){
    		
    		System.out.println("-----Session Timeout-----");
	        String accountId = request.getParameter("account_id");
	        Experiment_2016_12 acc = ofy().load().type(Experiment_2016_12.class).filter("accountID",accountId).first().now();

	        String key = acc.getAccountID();
	        
	        outputString = key + "125416";	        
	        
//	        cnt_df:buttonClickCount_drivingFeatures,
//        	cnt_ct:buttonClickCount_classificationTree,
//        	cnt_fo:buttonClickCount_filterOptions,
//        	cnt_af:buttonClickCount_applyFilter,
//        	cnt_ud:buttonClickCount_addUserDefFilter,
//        	cnt_ar:numOfArchViewed,
//        	cnt_db:numOfDrivingFeatureViewed,
//        	numArch_df: getDrivingFeatures_numOfArchs,
//        	numArch_ct: getClassificationTree_numOfArchs,
//        	threshold_df: getDrivingFeatures_thresholds
//	        userdef:userDefFilters
	        
	        String cnt_df = request.getParameter("cnt_df");
	        String cnt_ct = request.getParameter("cnt_ct");
	        String cnt_fo = request.getParameter("cnt_fo");
	        String cnt_af = request.getParameter("cnt_af");
	        String cnt_ud = request.getParameter("cnt_ud");
	        String cnt_ar = request.getParameter("cnt_ar");
	        String cnt_db = request.getParameter("cnt_db");
	        String numArch_df = request.getParameter("numArch_df");
	        String numArch_ct = request.getParameter("numArch_ct");
	        String threshold_df = request.getParameter("threshold_df");
	        String userdef = request.getParameter("userdef");

        	acc.setTimedOut(true);
        	acc.setMeasurements(cnt_df, cnt_ct, cnt_fo, cnt_af, cnt_ud, cnt_ar, 
        			cnt_db, numArch_df, numArch_ct, threshold_df, userdef);
        	ofy().save().entity(acc);
	        
    	}
    	


        response.flushBuffer();
        response.setContentType("text/html");
        response.setHeader("Cache-Control", "no-cache");
        response.getWriter().write(outputString);

//        Put things back
//        System.out.flush();
//        System.setOut(old);
//        Show what happened
//        System.out.println("Intercepted text:" + baos.toString());
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

    
    
    public static LoginServlet getInstance()
    {
        if( instance == null ) 
        {
            instance = new LoginServlet();
        }
        return instance;
    }
    
    
    
    @Entity
    public static class Experiment_2016_12{
    	
    	@Id Long id;
    	@Index String accountID;
    	@Index String type;
    	@Index boolean timedOut;
    	String loginTime;
    	int loginTrial;
    	
        String cnt_df ;
        String cnt_ct;
        String cnt_fo ;
        String cnt_af ;
        String cnt_ud ;
        String cnt_ar ;
        String cnt_db ;
        String numArch_df ;
        String numArch_ct ;
        String threshold_df ;
        String userdef ;
    	
    	
    	public Experiment_2016_12(){
    		timedOut=false;
    	}
    	
    	public void setAccountID(String id){this.accountID=id;}
    	public void setLoginTime(String time){this.loginTime=time;}
    	public void setType(String type){this.type=type;}
    	public void setLoginTrial(int n){this.loginTrial=n;}
    	public void setTimedOut(boolean timedout){this.timedOut=timedout;}
    	public void setMeasurements(String cnt_df,String cnt_ct, String cnt_fo, String cnt_af, 
    			String cnt_ud, String cnt_ar, String cnt_db, String numArch_df, String numArch_ct,
    			String threshold_df, String userdef){
    		
    		this.cnt_df=cnt_df;
    		this.cnt_ct=cnt_ct;
    		this.cnt_fo=cnt_fo;
    		this.cnt_af=cnt_af;
    		this.cnt_ud=cnt_ud;
    		this.cnt_ar=cnt_ar;
    		this.cnt_db=cnt_db;
    		this.numArch_df=numArch_df;
    		this.numArch_ct=numArch_ct;
    		this.threshold_df=threshold_df;
    		this.userdef=userdef;
    		
    	}
    	public String getAccountID(){return this.accountID;}
    	public String getLoginTime(){return this.loginTime;}
    	public String getType(){return this.type;}
    	public Long getID(){return this.id;}
    	public int getLoginTrial(){return this.loginTrial;}
    	public boolean getTimedOut(){return this.timedOut;}
    	
    	public String getCnt_df(){return cnt_df;}
    	public String getCnt_ct(){return cnt_ct;}
    	public String getCnt_fo(){return cnt_fo;}
    	public String getCnt_af(){return cnt_af;}
    	public String getCnt_ud(){return cnt_ud;}
    	public String getCnt_ar(){return cnt_ar;}
    	public String getCnt_db(){return cnt_db;}
    	public String getNumArch_df(){return numArch_df;}
    	public String getNumArch_ct(){return numArch_ct;}
    	public String getThreshold_df(){return threshold_df;}
    	public String getUserDef(){return userdef;}

    	
    }
    
    
    
}