library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (sample_a,sample_b,sample_c:in signed(7 downto 0);
    clamped_a,clamped_b,clamped_c:out signed(7 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    function clamp(v:signed(7 downto 0))return signed is begin if v < to_signed(-40,8)then return to_signed(-40,8);
    elsif v>to_signed(60,8)then return to_signed(60,8);
    else return to_signed(0,8);
    end if;
end;
begin
clamped_a<=clamp(sample_a);
clamped_b<=clamp(sample_b);
clamped_c<=clamp(sample_c);
end architecture;
