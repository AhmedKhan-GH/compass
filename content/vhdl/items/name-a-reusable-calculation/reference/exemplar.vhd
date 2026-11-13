library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (channel_a,channel_b,channel_c:in std_logic_vector(7 downto 0);
    count_a,count_b,count_c:out std_logic_vector(3 downto 0));
end entity;
architecture rtl of top_module is
    function count_ones(v:std_logic_vector)return std_logic_vector is variable n:unsigned(3 downto 0):=(others=>'0');
        begin for i in v'range loop if v(i)='1'then n:=n+1;
    end if;
end loop;
return std_logic_vector(n);
end;
begin
count_a<=count_ones(channel_a);
count_b<=count_ones(channel_b);
count_c<=count_ones(channel_c);
end architecture;
